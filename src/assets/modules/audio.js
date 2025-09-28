"use strict";

const menumusic = document.getElementById("menu-music");
const music = document.getElementById("music");
const sfx = document.getElementById("sfx");

// Volume Controls

function audioPermissionDialog() {
    window.onload = () => {
        document.getElementById("showAudioPerm").style.display = "flex";
    }; 
}
function setMusicVolume() {
    let musicVolume = (document.getElementById("musicVolume").value);
    music.volume = musicVolume;
    menumusic.volume = musicVolume;
    document.getElementById("musicVol").innerHTML = rn(musicVolume*100, 1);
}

function muteMusicToggle() {
    if (music.muted == false) {
        music.muted = true;
    } else if (music.muted == true) {
        music.muted = false;
    } else if (menumusic.muted == false) {
        menumusic.muted = true;
    } else if (menumusic.muted == true) {
        menumusic.muted = false;
    }
}

function setSFXVolume() {
    let sfxVolume = document.getElementById("sfxVolume").value;
    if (sfx.muted == true) {
        sfx.muted = false;
    }
    sfx.volume = sfxVolume;
    document.getElementById("sfxVol").innerHTML = rn(sfxVolume*100, 1);
}

function muteSFXToggle() {
    if (sfx.muted == false) {
        sfx.muted = true;
    } else if (sfx.muted == true) {
        sfx.muted = false;
    }
}

//Music Handler


//SFX Handler
const clickSFX = document.getElementsByName("clicksound");

document.getElementById("main-menu-container").querySelector("button").addEventListener("click", () => {clickSFX.play();});