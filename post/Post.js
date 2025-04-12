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
                console.log(this.details.wordCount)
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
}
