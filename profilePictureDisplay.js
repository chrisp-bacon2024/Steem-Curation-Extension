async function addUserVpRing_silent(){
    const username = getUsername?.();
    if (!username) return;
    const vp = await getVotingPower(username);
    addRingAroundUserpic_silent(vp);
}

addUserVpRing_silent = withSilentMutationsAsync(addUserVpRing_silent);

function addRingAroundUserpic_silent(percent = 75){
    const userPic = document.querySelector('.Userpic');
    if (!userPic) return;
    let wrap = userPic.closest('.avatar-wrap');
    if (!wrap) {
        wrap = document.createElement('div');
        wrap.className = 'avatar-wrap';
        userPic.parentNode.insertBefore(wrap, userPic);
        const cs = getComputedStyle(userPic);
        wrap.style.width = cs.width; wrap.style.height = cs.height;
        wrap.appendChild(userPic);
    }
    wrap.style.setProperty('--p', String(percent));
};

addRingAroundUserpic_silent = withSilentMutations(addRingAroundUserpic_silent);
