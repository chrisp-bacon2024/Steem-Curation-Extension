const loadPost = async (p_info, language) => {
    const postClass = document.querySelector('.Post');

    if (postClass) {
        let url = window.location.pathname;
        url = url.split('@')[1];
        const author = url.split('/')[0];
        const permlink = url.split('/')[1];
        const post = await Post.create(author, permlink);

        if (post) {
            const samePost = (p_info.author === author && p_info.permlink === permlink);

            if (!samePost) {
                _sceVoterTipsBound = false;
                displayWordCountAndReadingTime("PostFull__time_author_category_large", post.details.wordCount, post.details.readingTimeMinutes)
                loadPostValueGraph(post);
                loadPostVoteGraph(post);
                const payouts = await loadAuthorWeeklyEarningsGraph(post);
                if (payouts) {
                    loadAuthorWeeklyEarningsBarGraph(payouts);
                }
                loadPostVoteData(post);
                displayPostResteemData(post, ".RightShare__Menu");
                tips = attachVoterHoverTooltips(post, language, 7);
                getTipEfficiency(tips);
            } else {
                return p_info
            }

        } else {
            console.log('There was a problem loading the post data!');
        }
        return { "author": author, "permlink": permlink }
    } else {
        return { "author": null, "permlink": null }
    }
};

/**
 * Display word count and reading time in the specified container.
 * @param {string} containerClass - The class where the info will be appended.
 * @param {number} wordCount - The total word count of the content.
 */
const displayWordCountAndReadingTime = (containerClass, wordCount, readingTimeMinutes) => {
    console.log("entered function");
    const container = document.querySelector(`.${containerClass}`);
    if (!container) {
        console.log(`Container with class "${containerClass}" not found.`);
        return;
    }

    // Remove existing word count and reading time (if any) to avoid duplication
    const existingInfo = container.querySelector('.word-count-info');
    if (existingInfo) {
        existingInfo.remove();
    }

    // Create a wrapper for the info
    const infoWrapper = document.createElement('div');
    infoWrapper.className = 'word-count-info';
    infoWrapper.style.display = 'flex';
    infoWrapper.style.alignItems = 'center';
    infoWrapper.style.gap = '10px'; // Reduce the gap between sections
    infoWrapper.style.marginTop = '5px'; // Slightly smaller margin

    // Create word count section
    const wordCountSection = document.createElement('div');
    wordCountSection.style.display = 'flex';
    wordCountSection.style.alignItems = 'center';
    wordCountSection.style.gap = '3px'; // Reduce gap between icon and text

    const wordIcon = document.createElement('span');
    wordIcon.innerHTML = '📄'; // Replace with your desired icon
    wordIcon.style.fontSize = '14px'; // Slightly smaller icon size

    const wordCountText = document.createElement('span');
    wordCountText.textContent = `${wordCount.toLocaleString()} words`;
    wordCountText.style.fontSize = '12px'; // Reduce font size for better fit

    wordCountSection.appendChild(wordIcon);
    wordCountSection.appendChild(wordCountText);

    // Create reading time section
    const readingTimeSection = document.createElement('div');
    readingTimeSection.style.display = 'flex';
    readingTimeSection.style.alignItems = 'center';
    readingTimeSection.style.gap = '3px'; // Reduce gap between icon and text

    const clockIcon = document.createElement('span');
    clockIcon.innerHTML = '⏱️'; // Replace with your desired icon
    clockIcon.style.fontSize = '14px'; // Slightly smaller icon size

    const readingTimeText = document.createElement('span');
    readingTimeText.textContent = `${readingTimeMinutes} min read`;
    readingTimeText.style.fontSize = '12px'; // Reduce font size for better fit

    readingTimeSection.appendChild(clockIcon);
    readingTimeSection.appendChild(readingTimeText);

    // Append both sections to the wrapper
    infoWrapper.appendChild(wordCountSection);
    infoWrapper.appendChild(readingTimeSection);

    // Append the wrapper to the container
    container.appendChild(infoWrapper);
};

const loadPostValueGraph = (post) => {
    // Ensure the date strings are treated as UTC by appending 'Z'
    const postCreationTime = new Date(post.details.created + 'Z');
    const payoutEndTime = new Date(postCreationTime.getTime() + 7 * 24 * 60 * 60 * 1000); // Add 7 days to creation time

    // Filter votes within the payout period, treating times as UTC
    const activeVotes = sortVotesByTime(
        post.details.active_votes.filter((vote) => new Date(vote.time + 'Z') <= payoutEndTime)
    );

    if (activeVotes.length === 0) {
        console.log('SCE:No votes during the payout period to display.');
        return;
    }

    // Determine the scaling range based on post age
    const currentTime = new Date();
    const latestVoteTime = new Date(activeVotes[activeVotes.length - 1].time + 'Z').getTime();
    const maxElapsedMs = Math.min(latestVoteTime - postCreationTime.getTime(), currentTime - postCreationTime);

    const numIntervals = 10; // Define the number of intervals for the X-axis
    const intervalMs = maxElapsedMs / numIntervals; // Calculate the duration of each interval

    const timeLabels = [];
    const cumulativeTotalValues = new Array(numIntervals + 1).fill(0);
    const cumulativeOrganicValues = new Array(numIntervals + 1).fill(0);
    const cumulativeBurnValues = new Array(numIntervals + 1).fill(0);
    let cumulativeTotal = 0;
    let cumulativeOrganic = 0;
    let cumulativeBurn = 0;

    // Generate evenly spaced time labels
    for (let i = 0; i <= numIntervals; i++) {
        const elapsedMs = intervalMs * i;
        timeLabels.push(formatScaledTimeLabel(elapsedMs, maxElapsedMs)); // Format elapsed time
    }

    // Assign cumulative values to intervals
    activeVotes.forEach((vote) => {
        const voteTime = new Date(vote.time + 'Z').getTime();
        const elapsedMs = voteTime - postCreationTime.getTime();
        const intervalIndex = Math.min(Math.floor(elapsedMs / intervalMs), numIntervals - 1);
        cumulativeTotal += vote.value;
        cumulativeTotalValues[intervalIndex] = cumulativeTotal;

        cumulativeOrganicValues[intervalIndex] = vote.organic_value;
        cumulativeOrganic += vote.organic_value;
        cumulativeBurnValues[intervalIndex] = vote.burn_value;
        cumulativeBurn += vote.burn_value;
    });

    // Fill in any gaps in the cumulative values
    for (let i = 1; i < cumulativeTotalValues.length; i++) {
        if (cumulativeTotalValues[i] === 0) cumulativeTotalValues[i] = cumulativeTotalValues[i - 1];
        if (cumulativeOrganicValues[i] === 0) cumulativeOrganicValues[i] = cumulativeOrganicValues[i - 1];
        if (cumulativeBurnValues[i] === 0) cumulativeBurnValues[i] = cumulativeBurnValues[i - 1];
    }

    const data = [];
    if (cumulativeTotal === 0) {
        console.log("SCE: Post has no value");
        return;
    }

    data.push({ label: 'Total Value', data: cumulativeTotalValues, color: 'rgba(75, 192, 192, 1)' });

    if (cumulativeOrganic > 0) {
        data.push({ label: 'Organic Value', data: cumulativeOrganicValues, color: 'rgba(0, 200, 0, 1)' });
    }

    if (cumulativeBurn > 0) {
        data.push({ label: 'Burn Value', data: cumulativeBurnValues, color: 'rgba(255, 0, 0, 1)' });
    }

    createLineGraph(
        'c-sidebr-market',
        'postValueGraph',
        'Post Value Over Time ($)',
        timeLabels,
        data,
        'Value ($)'
    );
};


const loadPostVoteGraph = (post) => {
    // Ensure the date strings are treated as UTC by appending 'Z'
    const postCreationTime = new Date(post.details.created + 'Z');
    const payoutEndTime = new Date(postCreationTime.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Filter and sort active votes within the payout period, treating times as UTC
    const activeVotes = sortVotesByTime(
        post.details.active_votes.filter(vote => new Date(vote.time + 'Z') <= payoutEndTime)
    );

    if (activeVotes.length === 0) {
        console.log('SCE: No votes to display.');
        return;
    }

    // Determine the scaling range based on post age
    const currentTime = new Date();
    const latestVoteTime = new Date(activeVotes[activeVotes.length - 1].time + 'Z').getTime();
    const maxElapsedMs = Math.min(latestVoteTime - postCreationTime.getTime(), currentTime - postCreationTime);

    const numIntervals = 10; // Define the number of intervals for the X-axis
    const intervalMs = maxElapsedMs / numIntervals; // Calculate the duration of each interval

    const timeLabels = [];
    const cumulativeVoteCounts = new Array(numIntervals + 1).fill(0); // Pre-fill with zeros

    // Generate evenly spaced time labels
    for (let i = 0; i <= numIntervals; i++) {
        const elapsedMs = intervalMs * i;
        timeLabels.push(formatScaledTimeLabel(elapsedMs, maxElapsedMs)); // Format elapsed time
    }

    // Assign cumulative votes to intervals
    let totalVotes = 0;
    activeVotes.forEach(vote => {
        const voteTime = new Date(vote.time + 'Z').getTime();
        const elapsedMs = voteTime - postCreationTime.getTime();
        const intervalIndex = Math.min(Math.floor(elapsedMs / intervalMs), numIntervals - 1);
        totalVotes += 1;
        cumulativeVoteCounts[intervalIndex] = totalVotes;
    });

    // Fill in any gaps in the cumulative counts
    for (let i = 1; i < cumulativeVoteCounts.length; i++) {
        if (cumulativeVoteCounts[i] === 0) {
            cumulativeVoteCounts[i] = cumulativeVoteCounts[i - 1];
        }
    }

    createLineGraph(
        'c-sidebr-market',
        'postVoteGraph',
        'Total Votes Over Time',
        timeLabels,
        [{ label: 'Total Votes', data: cumulativeVoteCounts, color: 'rgba(75, 192, 192, 1)' }],
        'Votes',
        false
    );
};

/**
 * Load a graph displaying total payouts with post numbers on the X-axis.
 * Clicking a dot navigates to the corresponding post.
 * @param {Array} payouts - Array of Post class objects, already sorted from oldest to newest.
 */
const loadAuthorWeeklyEarningsGraph = async (post) => {
    console.log(`Fetching payouts for ${post.details.author}`);
    const payouts = await getAuthorPayoutsInWeekBefore(post.details.author, post.details.created);

    if (payouts.length === 1) {
        console.log("Only 1 payout in last week");
        return payouts;
    } else if (payouts.length === 0) {
        return null
    }

    // Prepare data for the graph
    const timeLabels = payouts.map((_, index) => `Post ${index + 1}`); // Post 1, Post 2, etc.
    const payoutValues = payouts.map(payout => payout.details.total_payout_value); // Use total_value for Y-axis
    console.log(payoutValues)

    // Create the graph
    const graphContainerClass = 'c-sidebr-market';
    const canvasId = 'authorPayoutGraph';
    const graphTitle = 'Previous Week Payouts';
    const yAxisLabel = 'Payout ($)';

    createLineGraphWithClickableDots(
        graphContainerClass,
        canvasId,
        graphTitle,
        timeLabels,
        payoutValues,
        yAxisLabel,
        payouts
    );

    return payouts
};

/**
 * Load a bar graph displaying the sums of total, organic, and burn values for the last week.
 * @param {Array} payouts - Array of Post class objects with `total_value`, `organic_payout_value`, and `burn_payout_value`.
 */
const loadAuthorWeeklyEarningsBarGraph = (payouts) => {
    if (payouts.length === 0) {
        console.warn("No payouts to display in the bar graph.");
        return;
    }

    // Calculate the sums
    const totalSum = payouts.reduce((sum, payout) => sum + payout.details.total_payout_value, 0);
    const organicSum = payouts.reduce((sum, payout) => sum + (payout.details.organic_payout_value || 0), 0);
    const burnSum = payouts.reduce((sum, payout) => sum + (payout.details.burn_payout_value || 0), 0);

    console.log({ totalSum, organicSum, burnSum });

    if (totalSum === 0) {
        console.log("Total Value 0")
        return
    }

    const xAxisLabels = ['Total Value'];
    const dataValues = [totalSum];
    const colors = ['rgba(75, 192, 192, 0.7)']; // Blue for Total
    if (organicSum > 0) {
        xAxisLabels.push('Organic Value');
        dataValues.push(organicSum);
        colors.push('rgba(0, 255, 0, 0.7)') // Green for Organic
    }
    if (burnSum > 0) {
        xAxisLabels.push('Burn Value')
        dataValues.push(burnSum)
        colors.push('rgba(255, 0, 0, 0.7)') // Red for Burn
    }


    // Create the graph
    const graphContainerClass = 'c-sidebr-market';
    const canvasId = 'weeklyEarningsBarGraph';
    const graphTitle = 'Week Payout Summary';
    const yAxisLabel = 'Payout ($)';

    createBarGraph(graphContainerClass, canvasId, graphTitle, xAxisLabels, dataValues, yAxisLabel, colors);
};

const loadPostVoteData = (post) => {
    const votingClass = document.getElementsByClassName('Voting__voters_list');

    if (votingClass.length > 0) {
        // Access the first element with the class 'Voting__voters_list'
        const votingElement = votingClass[0]; // Index may change in future updates!

        // Find the <ul> with the specified classes inside the 'Voting' element
        const voters_list = votingElement.querySelector('ul.VerticalMenu.menu.vertical');

        if (voters_list) {
            const listItems = voters_list.querySelectorAll('li');

            if (listItems) {
                listItems.forEach((item) => {

                    // Extract the username from the textContent (assumes format "+ username")
                    const username = item.textContent.split(' ')[1].trim()

                    // Find the corresponding vote in the activeVotes list
                    const vote = post.details.active_votes.find(v => v.voter === username);

                    if (vote) {
                        // Reformat the text content
                        const first_digit = item.textContent.split(' ')[0];
                        const percent = (vote.percent / 100).toFixed(0);

                        // Add a custom class to style the list items
                        item.classList.add('vote-item');

                        // Format and update the text content with a clickable link for the username
                        if (vote.value > 0) {
                            item.innerHTML = `
                                        <span class="vote-value">$${vote.value.toFixed(2)}</span>
                                        <span class="vote-percentage">(${vote.percentage}%)</span>
                                        <a href="/@${username}" class="vote-username">${username}</a>
                                        <span class="vote-weight">(${percent}% weight)</span>
                                    `;
                        } else {
                            item.innerHTML = `
                                        <a href="/@${username}" class="vote-username">${username}</a>
                                        <span class="vote-weight">(${percent}% weight)</span>
                                    `;
                        }

                    }
                });
            }
        } else {
            console.log('SCE: Unordered list not found within votingClass element.');
        }
    } else {
        console.log('SCE: Element with class "Voting__voters_list" not found.');
    }
}

const displayPostResteemData = async (post, anchorClassSelector) => {
    const res = await getResteems(post.author, post.permlink)
    const resteems = res.result.rows
    if (resteems.length === 0) {
        return
    }

    const anchorElement = document.querySelector(anchorClassSelector);
    if (!anchorElement) {
        console.warn(`Element with class "${anchorClassSelector}" not found.`);
        return;
    }
    const existingDropdown = anchorElement.querySelector('.sce-resteem-dropdown-container');
    if (existingDropdown) {
        console.log("SCE: Resteem dropdown already exists for this post (relative positioning).");
        return;
    }

    // Create the dropdown container
    const dropdownContainer = document.createElement('div');
    dropdownContainer.className = 'DropdownMenu';
    // dropdownContainer.style.position = 'relative';
    // dropdownContainer.style.left = '55%'; // Adjust '335px' as needed (positive value moves right) - TODO: anchor location to resteem button.
    // dropdownContainer.style.top = '0';
    dropdownContainer.style.marginLeft = 0;

    // Create the dropdown trigger as an anchor element
    const dropdownTrigger = document.createElement('a');
    dropdownTrigger.href = '#'; // Set href to "#" to emulate an anchor
    dropdownTrigger.className = 'resteem-dropdown-trigger';

    // Add an event listener to the dropdown menu to prevent snap-back to the top
    dropdownTrigger.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent the default anchor behavior
        dropdownMenu.classList.toggle('visible');
    });

    // Create an SVG element for the triangle icon
    const svgIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgIcon.setAttribute("width", "16"); // Set the width of the icon
    svgIcon.setAttribute("height", "16"); // Set the height of the icon
    svgIcon.setAttribute("viewBox", "0 0 512 512"); // Set the view box for the SVG
    svgIcon.classList.add('triangle-icon'); // Add a class for styling

    // Create the polygon element for the triangle
    const triangle = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    triangle.setAttribute("points", "128,90 256,218 384,90");
    triangle.setAttribute("fill", "currentColor"); // Use current color for the fill

    // Append the triangle to the SVG
    svgIcon.appendChild(triangle);

    // Create a text node for the resteem count
    // const resteemCountText = document.createTextNode(`${resteems.length} Resteems `);
    const resteemCountText = document.createElement('span');
    resteemCountText.textContent = `${resteems.length} Resteems `;
    resteemCountText.classList.add('resteem-count-text'); // Add a class for styling

    // Append the text and the SVG icon to the dropdown trigger
    dropdownTrigger.appendChild(resteemCountText);
    dropdownTrigger.appendChild(svgIcon);

    // Create the dropdown menu
    const isDarkMode = document.body.classList.contains('theme-dark');
    const resteemDropdownBgColor = isDarkMode ? '#1C252B' : '#F4F4F4';
    const dropdownMenu = document.createElement('ul');
    // dropdownMenu.className = 'resteem-dropdown-menu';
    dropdownMenu.className = 'resteem-dropdown-menu';
    // Set the background color of the dropdown menu, depending on dark/light mode
    dropdownMenu.style.backgroundColor = resteemDropdownBgColor;

    console.log("Resteems data:", resteems);
    // Populate the dropdown menu with resteemers
    resteems.forEach(resteem => {
        const resteemer = resteem[1];
        const listItem = document.createElement('li');
        listItem.className = 'resteem-dropdown-item';
        const link = document.createElement('a');
        link.href = `/@${resteemer}`;
        link.textContent = resteemer;
        // link.className = 'resteem-dropdown-link';
        link.className = 'vote-username';

        listItem.appendChild(link);
        dropdownMenu.appendChild(listItem);
    });

    // Prevent clicks inside the dropdown menu from closing it
    dropdownMenu.addEventListener('click', (event) => {
        event.stopPropagation();
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (event) => {
        if (!dropdownWrapper.contains(event.target)) {
            dropdownMenu.classList.remove('visible');
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (event) => {
        if (!dropdownContainer.contains(event.target)) {
            dropdownMenu.classList.remove('visible');
        }
    });

    // Create a wrapper for the dropdown
    const dropdownWrapper = document.createElement('div');
    dropdownWrapper.className = 'resteem-dropdown-wrapper';

    // Append the dropdown components to the wrapper
    dropdownContainer.appendChild(dropdownMenu);
    dropdownContainer.appendChild(dropdownTrigger);
    dropdownWrapper.appendChild(dropdownContainer);

    // Append the dropdown container to the Reshare container element
    anchorElement.appendChild(dropdownWrapper);
}