"use strict";

//Audio Settings Handler
function settingsApply() {
    setMusicVolume();
    setSFXVolume();
}

//Music Handler
const music = document.getElementById("music");
const sfx = document.getElementById("sfx");

function audioPermissionDialog() {
    window.onload = (event) => {
        document.getElementById("showAudioPerm");
    }; 
}
function setMusicVolume() {
    let musicVolume = document.getElementById("musicVolume").value;
    if (music.muted == true) {
        music.muted = false;
    }
    music.volume = musicVolume;
    document.getElementById("musicVol").innerHTML = rn(musicVolume*100, 1);
}

function muteMusicToggle() {
    if (music.muted == false) {
        music.muted = true;
    } else if (music.muted === true) {
        music.muted = false;
    }
}

//Audio Handler
function setSFXVolume() {
    let sfxVolume = document.getElementById("sfxVolume").value;
    if (sfx.muted == true) {
        sfx.muted = false;
    }
    sfx.volume = sfxVolume;
    document.getElementById("sfxVol").innerHTML = rn(sfxVolume*100, 1);
}