let _sceVoterTipsBound = false;

const attachVoterHoverTooltips = (post, language, days = 7) => {
    const votersUL = document.querySelector('.Voting__voters_list ul.VerticalMenu.menu.vertical');
    if (!votersUL) return;

    const postCache = new Map();
    const keyFor = (a, p) => `${a}/${p}`

    const getPostCached = (author, permlink, time) => {
        const key = keyFor(author, permlink);
        if (!postCache.has(key)){
            postCache.set(key, (async () => {
                const p = new Post(author, permlink);
                await p.fetchDetails();
                await p.getVoteData();
                await p.getTotalVests(time);

                return p;
            })());
        }
        return postCache.get(key);
    };

    const voteItems = votersUL.querySelectorAll('li.vote-item');
    const tips = [];
    const tipByLi = new WeakMap();



    for (let i = 0; i < voteItems.length; i++) {
        const item = voteItems[i];
        const usernameEl = item.querySelector('.vote-username');
        if (!usernameEl) return;

        const username = usernameEl.textContent.trim();
        const vote = post.details.active_votes.find((v) => v.voter === username);
        if (!vote) return;

        const tip = new VoterTip({
            li: item, 
            post: post, 
            getPostCached: getPostCached, 
            language: language,
            vote: vote,
            days: days
        });
        tipByLi.set(item, tip);
        tips.push(tip);

    };

    if (_sceVoterTipsBound) return tips;
    _sceVoterTipsBound = true;

    let currentLi = null;

    votersUL.addEventListener('mouseover', (e) => {
        if (e.target.closest('.voter-tooltip')) return;
        console.log('moused over!')

        const li = e.target.closest('li.vote-item');
        if (!li || li === currentLi || !votersUL.contains(li)) return;
        if (currentLi) tipByLi.get(currentLi)?.hide();
        currentLi = li;
        const tip = tipByLi.get(li)
        tip?.show();

    });

    votersUL.addEventListener('mouseout', (e) => {
        if (e.relatedTarget && (e.currentTarget.contains(e.relatedTarget) ||
            e.relatedTarget.closest?.('.voter-tooltip'))
        ) {
                return;
        };
        const li = e.target.closest('li.vote-item');
        if (!li || li !== currentLi) return;
        const toEl = e.relatedTarget;
        if (!toEl || !li.contains(toEl)) {
        tipByLi.get(li)?.hide();
        currentLi = null;
        }
    });
    return tips;
};

const getTipEfficiency = async(tips) => {
    for (const tip of tips){
        await tip.prefetchEfficiencyData();
    }
}

const getHistoricCurationRewards = async (voter, post, days) => {
    const created = new Date(post.details.created);

    const createdMs = created.getTime();

    const oneDay = 24 * 60 * 60 * 1000
    const timeSpan = days * oneDay

    const dayBeforeMs = createdMs - oneDay;
    const weekBeforeDayBeforeMs = dayBeforeMs - timeSpan;

    const upperDay = Math.floor(dayBeforeMs / 1000);
    const lowerDay = Math.floor(weekBeforeDayBeforeMs / 1000);

    try {
        const url = `https://sds.steemworld.org/rewards_api/getRewards/curation_reward/${voter}/${lowerDay}-${upperDay}`;

        // Make the request
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }

        // Parse JSON response
        const data = await response.json();
        return data.result;

    } catch (error) {
        console.error("Error fetching curation rewards:", error);
    return null;
  }
}

