/*const botList = ["abb-curation", "avle", "bot-api", "boomerang", "coin-doubler",
    "gotogether", "h4lab", "heroism", "justyy", "nixiee", "nutbox.mine",
    "oppps", "robiniaswap", "shy-fox", "steem-punks", "steem.botto", 
    "steembasicincome", "steemegg", "successgr.with", "suntr", "support-kr",
    "templar-kr", "tipu", "uco.bnb-d", "uco.intern", "upex", "upmewhale",
    "upvu", "upvu.witness", "vfund", "vote.steem-aaa", "xiguang"];*/

class Post {
    constructor(author, permlink) {
        this.author = author;
        this.permlink = permlink;
        this.details = null; // Initially null until fetched
    }

    static async create(author, permlink) {
        const post = new Post(author, permlink);
        await post.fetchDetails();
        post.details.active_votes = post.getVoteData(); 
        return post;
    }

    // Fetch post details from the API
    async fetchDetails() {
        const steemApi = "https://api.steemit.com";
        try {
            const response = await fetch(steemApi, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    method: "condenser_api.get_content",
                    params: [this.author, this.permlink],
                    id: 1,
                }),
            });

            const result = await response.json();
            if (result.result) {
                const rawDetails = result.result;

                // Utility function to parse STEEM strings into floats
                const parseSteemValue = (value) =>
                    parseFloat(value.replace(" STEEM", ""));

                // Parse json_metadata and date fields



                this.details = {
                    ...rawDetails,
                    json_metadata: rawDetails.json_metadata
                        ? JSON.parse(rawDetails.json_metadata)
                        : {}, // Default to empty object if parsing fails
                    last_update: new Date(rawDetails.last_update),
                    created: new Date(rawDetails.created),
                    active: new Date(rawDetails.active),
                    last_payout: new Date(rawDetails.last_payout),
                    cashout_time: new Date(rawDetails.cashout_time),
                    max_cashout_time: new Date(rawDetails.max_cashout_time),
                    total_payout_value: 2 * parseSteemValue(rawDetails.curator_payout_value),
                    curator_payout_value: parseSteemValue(rawDetails.curator_payout_value),
                    max_accepted_payout: parseSteemValue(rawDetails.max_accepted_payout),
                    pending_payout_value: parseSteemValue(rawDetails.pending_payout_value),
                    total_pending_payout_value: parseSteemValue(rawDetails.total_pending_payout_value),
                    promoted: parseSteemValue(rawDetails.promoted),
                    active_votes: rawDetails.active_votes.map((vote) => ({
                        ...vote,
                        time: new Date(vote.time),
                    })),
                };
                this.details.burnPct = 0
                const null_beneficiary = this.details.beneficiaries.find(b => b.account === "null")
                if (null_beneficiary) {
                    this.details.burnPct = null_beneficiary.weight / 10000
                }
                this.details.burn_payout_value = this.details.burnPct * this.details.curator_payout_value;
                const botVotePct = calculateRsharePercentage(rawDetails.active_votes);
                this.details.organic_payout_value = this.details.total_payout_value * (1 - 0.01 * botVotePct);
                this.details.wordCount = getWordCount(this.details.body);
                this.details.readingTimeMinutes = getReadingTime(this.details.wordCount);

            } else {
                console.warn("No details found for the post.");
            }
        } catch (error) {
            console.error("Error fetching post details:", error);
            throw error;
        }
    }

    getVoteData() {
        const votes = this.details.active_votes;
        votes.sort((a, b) => new Date(a.time) - new Date(b.time));
        let total_value;
        if (this.details.total_payout_value > 0){
            total_value = this.details.total_payout_value
        } else {
            total_value = this.details.pending_payout_value
        }
        let total_rshares = 0;
        let vote;
        for (vote of votes){
            total_rshares += vote.rshares / 1000000;
        }
        this.details.totalRshares = total_rshares
        const values = [];
        let vote_val;
        let botVotePct;
        let temp_total_value = 0;
        let percentage;
        for (let i=0; i<votes.length; i++){
            vote = votes[i]
            percentage = ((vote.rshares / 1000000 / total_rshares) * 100).toFixed(0)
            vote_val = (percentage / 100) * total_value
            vote.percentage = Number(percentage)
            vote.value = vote_val
            temp_total_value += vote.value;
            vote.time = new Date(vote.time)
            botVotePct = calculateRsharePercentage(votes.slice(0,i));
            vote.organic_value = temp_total_value * (1 - 0.01 * botVotePct)
            // console.log(vote.organic_value)
            vote.burn_value = ( temp_total_value / 2 ) * this.details.burnPct;
        }
        return votes
    }

    async getTotalVests(payoutTimeInt){
        const sumBeneficiaryWeightsBP = (beneficiaries) => {
            if (!Array.isArray(beneficiaries)) return 0;
            return beneficiaries.reduce((sum, b) => {
                const w = Number(b?.weight);
                return sum + (Number.isFinite(w) ? w : 0);
            }, 0);
        };

        const totalBenBP = sumBeneficiaryWeightsBP(this.details.beneficiaries)
        const totalBenFrac = Math.min(Math.max(totalBenBP / 10000, 0), 1);
        let percentage = 0.5 - totalBenFrac;
        const ε = 1e-9;

        let url, scaleBy;

        if (percentage <= ε){
            const ben0 = this.details.beneficiaries?.[0];
            if (!ben0 || !Number.isFinite(ben0.weight) || ben0.weight <= 0) return;
            url = `https://sds.steemworld.org/rewards_api/getRewards/comment_benefactor_reward/${ben0.account}/${payoutTimeInt-30000}-${payoutTimeInt+30000}`;
            scaleBy = ben0.weight / 10000;
        } else {
            url = `https://sds.steemworld.org/rewards_api/getRewards/author_reward/${this.author}/${payoutTimeInt-30000}-${payoutTimeInt+30000}`;
            scaleBy = percentage;
        }

        let response;
        let data; 
        const MAX_RETRIES = 6;
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                response = await fetch(url);
                if (response.ok) {
                    try {
                    data = await response.json();
                    break;
                    } catch (e) {
                    console.warn(`JSON parse failed (attempt ${attempt}/${MAX_RETRIES})`, e);
                    }
                } else {
                    if (response.status >= 500 && response.status < 600) {
                        console.warn(`Server ${response.status}; retrying ${attempt}/${MAX_RETRIES}`);
                    } else {
                        console.error(`HTTP error ${response.status}; not retrying`);
                    return;
                    }
                }
            } catch (err) {
                console.warn(`Fetch failed (attempt ${attempt}/${MAX_RETRIES})`, err);
            }
            await sleep(200 * attempt);
        }

        if (!data) {
            console.error('Failed to retrieve reward data after retries.');
            return;
        }
        
        const cols = data?.result?.cols;
        const authInd = cols["author"];
        const permInd = cols["permlink"];
        const sbdInd = cols["sbd"];
        const steemInd = cols["steem"]
        const vestsInd = cols["vests"];

        const rows = data?.result?.rows;
        const reward = rows?.find(r => r[authInd] === this.author && r[permInd] === this.permlink)
        if (!reward) return;
        
        const rewardVests = Number(reward[vestsInd]) || 0;
        const rewardSbd = Number(reward[sbdInd]) || 0;
        const rewardSteem = Number(reward[steemInd]) || 0;

        if (rewardSbd > 0 || rewardSteem > 0) {
            scaleBy = scaleBy / 2;
        }
        if (rewardVests <= 0) return;
        if (scaleBy == null || !Number.isFinite(scaleBy) || scaleBy <= 0) return;
        this.details.totalVests = rewardVests * (1 / scaleBy);
    }
}
