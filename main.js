console.log("The extension is up and running...");

var promotedPosts = {}; // contains all transactions for promoted posts with accounts, count, and whether self-promoted
const urlRequestTransfers = "https://sds.steemworld.org/transfers_api/getTransfersByTypeTo/transfer/null/time/DESC/250/0";
const urlRequestAccount = "https://sds.steemworld.org/accounts_api/getAccountExt/";
const steemApi = "https://api.steemit.com";
const sdsEndpoint = "https://sds.steemworld.org";
const curatorStringRegex = /(Curators|Curador|Curateurs|Curatori|キュレーター|큐레이터 |Kuratorzy|Кураторские|Кураториські|审查收入)/
const promotedCostStringRegex = /(?:Promotion Cost|Coste de promoción|Cout de la promotion|Costo della Promozione|プロモーションコスト|홍보 비용|Koszty promocji|Цена продвижения|Вартість просування|推广费)(?::)?\s*.*?\$.*/

let post_info = {"author":null, "permlink":null}

let USER_LANGUAGE;

// ---- 1) global guard
let SCE_SILENT = 0;

// Wrap sync code
function withSilentMutations(fn) {
  return function (...args) {
    SCE_SILENT++;
    try { return fn.apply(this, args); }
    finally { SCE_SILENT--; }
  };
}

// Wrap async code
function withSilentMutationsAsync(fn) {
  return async function (...args) {
    SCE_SILENT++;
    try { return await fn.apply(this, args); }
    finally { SCE_SILENT--; }
  };
}


/*
 *  The main logic is in highLight() and handleProfileDropdownClick()
 * o highlight()
 * - Add highlighting to posts with post promotion or @null beneficiaries.
 * - Add highlighting to the burn & promotion settings when post-> value item is clicked.
 * 
 * o handleProfileDropdownClick()
 * - Display the voting power of the logged in account when the dropdown menu is clicked.
 *
 */
const highLight = () => {
    var curatorBackgroundColor;
    const listItem = document.querySelectorAll('li');

    // Working from high to low (for outside to inside in document nesting)
    for (let i = listItem.length - 1; i >= 0; i--) {
        if (listItem[i].textContent.match(curatorStringRegex)) {
            // Don't highlight promoted posts that already paid out.
            listItem[i].style['background-color'] = "initial";
            continue;
        }

        // Check for @null beneficiary and /promoted post promotion.
        if (listItem[i].textContent.match('null: .*%') && listItem[i].textContent.match(promotedCostStringRegex)) {
            console.log("Found a /promoted post in #burnsteem25 (outer block)");
            curatorBackgroundColor = '#1E90FF';
            listItem[i].style['background-color'] = curatorBackgroundColor;

        // Check for just @null beneficiary
        } else if (listItem[i].textContent.match('null: .*%')) {
            console.log("Found #burnsteem25");
            var str = listItem[i].textContent;
            var nullPct = str.substring(
                str.indexOf(" ") + 1,
                str.lastIndexOf("%")
            );
            curatorBackgroundColor = getColorBurnPost(nullPct);
            listItem[i].style['background-color'] = curatorBackgroundColor;

        // Check for just /promoted post promotion
        } else if (listItem[i].textContent.match(promotedCostStringRegex)) {
            console.log("Found a /promoted post");
            var str = listItem[i].textContent;
            var indexEnd = (str.indexOf("(") >= 0) ? str.indexOf("(") - 1 : str.length;
            var promoAmount = str.substring(
                str.indexOf("$") + 1,
                indexEnd
            );
            curatorBackgroundColor = getColorPromotedPost(promoAmount);

            // now edit the textContent
            addText(listItem[i]);
            listItem[i].style['background-color'] = curatorBackgroundColor;
        } else {
            listItem[i].style['background-color'] = "initial";
        }
    }
}

async function handleProfileDropdownClick(event) {
    const titleElements = document.querySelectorAll('li.title');
    let accountElement;

    titleElements.forEach(async element => {
        if (element.textContent.trim() === element.childNodes[0].textContent.trim()) {
            accountElement = element;
        }
    });
    if (accountElement) {
        let elementText = accountElement.textContent.trim();
        const username = elementText.split(" ")[0] 
        const votingPower = await getVotingPower(username);
        accountElement.textContent = `${username} (VP: ${votingPower}%)`;
    }
}

/*
 * helper functions
 */
function getColorBurnPost(nullPct) {
    if (nullPct > 0 && nullPct < 25) {
        curatorBackgroundColor = "coral";
    } else if (nullPct < 50) {
        curatorBackgroundColor = "orange";
    } else if (nullPct < 75) {
        curatorBackgroundColor = "darkorange";
    } else if (nullPct > 0) {
        curatorBackgroundColor = "orangered";
    }
    return curatorBackgroundColor;
}

function getColorPromotedPost(promoAmount) {
    if (promoAmount > 0 && promoAmount < 0.26) {
        curatorBackgroundColor = "paleturquoise";
    } else if (promoAmount < 0.51) {
        curatorBackgroundColor = "aquamarine";
    } else if (promoAmount < 1.01) {
        curatorBackgroundColor = "turquoise";
    } else if (promoAmount > 0) {
        curatorBackgroundColor = "lightseagreen";
    }
    return curatorBackgroundColor;
}

function prepareData(data) {
    if (data) {
        const cols = data.result.cols;
        const rows = data.result.rows;
        rows.forEach(trf => {
            let trfData = getAuthorPost(trf[cols["memo"]]);
            if (trfData) {
                let from = trf[cols["from"]];
                let self = (from == trfData["author"]);
                let props = { "user": [from], "count": 1, "self": self };
                let key = trfData["post"];
                if (promotedPosts && key in promotedPosts) {
                    let oldProps = promotedPosts[key];
                    if (!(oldProps["user"].includes(from))) {
                        props["user"] = props["user"].concat(oldProps["user"]);
                        props["count"] += oldProps["count"];
                        props["self"] = props["self"] || oldProps["self"];
                    } else {
                        props = oldProps;
                    }
                }
                promotedPosts[key] = props;
            }
        });
    };
}

function getAuthorPost(memoStr) {
    const objMatch = regexMatch(true, memoStr);
    let result = (objMatch && objMatch.length == 3) ? {
        "post": objMatch.groups["author"] + "/" + objMatch.groups["permlink"],
        "author": objMatch.groups["author"]
    } : null;
    return result;
}

function addText(listItem) {
    var added = false;
    if (!listItem.textContent.includes('User')) {
        let address = getAddress(listItem);
        if (address !== null) {
            let key = getPost(address);
            if (promotedPosts[key]) {
                let newText = ' (by ' +
                    promotedPosts[key]["count"] +
                    (promotedPosts[key]["count"] == 1 ? ' User' : ' Users') +
                    (promotedPosts[key]["self"] ? ' incl. self)' : ')');
                let newTextNode = document.createTextNode(newText);
                listItem.firstChild.appendChild(newTextNode);
                added = true
            }
        }
    }
    if (added) {
        console.log("User added");
    } else {
        console.log("Adding User went wrong");  // else branch not needed(?)
    }
}

function getPost(address) {
    const objMatch = regexMatch(false, address);
    return (objMatch && objMatch.length == 3) ? objMatch.groups["author"] + "/" + objMatch.groups["permlink"] : null;
}

function regexMatch(fromBegin, textStr) {
    re = fromBegin ? /^@(?<author>[\w-.]+)[\/](?<permlink>[\w-\|]+)$/ : /@(?<author>[\w-.]+)[\/](?<permlink>[\w-\|]+)$/;
    return textStr.match(re);
}

function getAddress(elem) {
    var link;
    while (elem.parentElement && elem.parentElement.nodeName.toLowerCase() != 'body') {
        elem = elem.parentElement;
        if (elem.nodeName.toLowerCase() == 'div' && elem.className.includes('articles__content-block--text')) {
            let titleElemList = elem.getElementsByClassName('entry-title');
            link = titleElemList[0].firstChild.href;
            break;
        }
    }
    return link ? link : null;
}

/*
 * Network queries
 */

const getUsername = () =>{
    const titleElements = document.querySelectorAll('li.title');
    titleElements.forEach(element => {
        if (element.textContent.trim() === element.childNodes[0].textContent.trim()) {
            accountElement = element;
        }
    });
    if (accountElement) {
        let elementText = accountElement.textContent.trim();
        const username = elementText.split(" ")[0]
        return username 
    }
}

// Function to get voting power
async function getVotingPower(username) {
    const urlRequestAccountFull = `${urlRequestAccount}${username}/null/upvote_mana_percent`;
    const response = await fetch(urlRequestAccountFull);
    const data = await response.json();
    return data.result?.upvote_mana_percent;
}

// Should this be repeated with a timer?
fetch(urlRequestTransfers).then(function (response) {
    return response.json();
}).then(function (data) {
    prepareData(data);
    highLight();
}).catch(function (error) {
    console.log("error: fetching transfers:", error);
});

/*
 * Execution and event handling
 */

// Event handler when the dropdown menu is clicked.  Calls: handleProfileDropdownClick for modifications.
function modifyUserElement() {
    const usermenuDropdown = document.querySelector('.DropdownMenu.Header__usermenu');
    if ( usermenuDropdown ) {
        usermenuDropdown.addEventListener('click', handleProfileDropdownClick);
    }
}

// Mutation observer to detect logout -> login and other page changes.
const sceMutationObserver = () => {
  const root = document.body; // narrower than `document`
  const config = { childList: true, subtree: true }; // start: no attributes

  const observer = new MutationObserver(() => {
    if (SCE_SILENT) return;

    if (sceMutationObserver.__pending) return;
    sceMutationObserver.__pending = true;
    requestAnimationFrame(() => {
        sceMutationObserver.__pending = false;
        runOncePerBatch();
    })
  });

  observer.observe(root, config);

  const runOncePerBatch = () => {
    SCE_SILENT++;
    try {
        addButtonsToSummaries();
        modifyUserElement();
        highLight();
        updateResteemVisibility();

        const newLang = detectUserLanguage();
        if (newLang && newLang !== USER_LANGUAGE) USER_LANGUAGE = newLang;

        updatePayoutValue();

        addUserVpRing_silent();
        maybeLoadPost();
    } finally {
        SCE_SILENT--;
    }
  }
}


window.addEventListener('load', async () => {
    post_info = await loadPost({"author":null, "permlink":null}, USER_LANGUAGE); // Call your function

});

window.addEventListener('click', async () => {
     // Call your function
     post_info = await loadPost(post_info, USER_LANGUAGE);
});

window.addEventListener('scroll', async () => {
})

addButtonsToSummaries();        // New for curation info buttons
sceMutationObserver();         // Mutation observer for new dropdown menu after login.
createResteemToggleControl();         // Resteem checkbox

console.log("The extension is done.");