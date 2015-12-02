var options = {
    hosts: {
        domain: 'hristo.jitsi.net',
        muc: 'conference.hristo.jitsi.net', // FIXME: use XEP-0030
        bridge: 'jitsi-videobridge.hristo.jitsi.net', // FIXME: use XEP-0030
    },
    bosh: '//hristo.jitsi.net/http-bind', // FIXME: use xep-0156 for that
    clientNode: 'http://jitsi.org/jitsimeet', // The name of client node advertised in XEP-0115 'c' stanza
}

var confOptions = {
    openSctp: true,
    disableAudioLevels: true
}

/**
 * Handles local tracks.
 * @param tracks Array with JitsiTrack objects
 */
function onLocalTracks(tracks)
{
    localTracks = tracks;
    for(var i = 0; i < localTracks.length; i++)
    {
        if(localTracks[i].getType() == "video") {
            $("body").append("<video autoplay='1' id='localVideo" + i + "' />");
            localTracks[i].attach($("#localVideo" + i ));
        } else {
            $("body").append("<audio autoplay='1' id='localAudio" + i + "' />");
            localTracks[i].attach($("#localAudio" + i ));
        }

            room.addTrack(localTracks[i]);
        console.log(localTracks[i]);
    }
}

/**
 * Handles remote tracks
 * @param track JitsiTrack object
 */
function onRemoteTrack(track) {
    var participant = track.getParitcipantId();
    if(!remoteTracks[participant])
        remoteTracks[participant] = [];
    var idx = remoteTracks[participant].push(track);
    var id = participant + track.getType() + idx;
    if(track.getType() == "video") {
        $("body").append("<video autoplay='1' id='" + participant + "video" + idx + "' />");
    } else {
        $("body").append("<audio autoplay='1' id='" + participant + "audio' />");
    }
    track.attach($("#" + id));
}

/**
 * That function is executed when the conference is joined
 */
function onConferenceJoined () {
    console.log("conference joined!");
    JitsiMeetJS.createLocalTracks({devices: ["audio", "video", "desktop"]}).then(onLocalTracks).catch(function (error) {
        console.log(error);
    });
}

function onUserLeft(id) {
    if(!remoteTracks[id])
        return;
    var tracks = remoteTracks[id];
    for(var i = 0; i< tracks.length; i++)
        tracks[i].detach($("#" + id + tracks[i].getType()))
}

/**
 * That function is called when connection is established successfully
 */
function onConnectionSuccess(){
    room = connection.initJitsiConference("conference2", confOptions);
    room.on(JitsiMeetJS.events.conference.TRACK_ADDED, onRemoteTrack);
    room.on(JitsiMeetJS.events.conference.TRACK_REMOVED, function () {
        console.debug("track removed!!!");
    });
    room.on(JitsiMeetJS.events.conference.CONFERENCE_JOINED, onConferenceJoined);
    room.on(JitsiMeetJS.events.conference.USER_JOINED, function(id){ remoteTracks[id] = [];});
    room.on(JitsiMeetJS.events.conference.USER_LEFT, onUserLeft);
    room.on(JitsiMeetJS.events.conference.TRACK_MUTE_CHANGED, function (track) {
        console.debug(track.getType() + " - " + track.isMuted());
    });
    room.on(JitsiMeetJS.events.conference.DISPLAY_NAME_CHANGED, function (userID, displayName) {
        console.debug(userID + " - " + displayName);
    });
    room.on(JitsiMeetJS.events.conference.TRACK_AUDIO_LEVEL_CHANGED,
      function(userID, audioLevel){
          // console.log(userID + " - " + audioLevel);
      });
    room.join();
};

/**
 * This function is called when the connection fail.
 */
function onConnectionFailed(){console.error("Connection Failed!")};

/**
 * This function is called when we disconnect.
 */
function disconnect(){
    console.log("disconnect!");
    connection.removeEventListener(JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED, onConnectionSuccess);
    connection.removeEventListener(JitsiMeetJS.events.connection.CONNECTION_FAILED, onConnectionFailed);
    connection.removeEventListener(JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED, disconnect);
}

function unload() {
//    room.leave();
    connection.disconnect();
}

$(window).bind('beforeunload', unload);
$(window).bind('unload', unload);



// JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.ERROR);
var initOptions = {
    // Desktop sharing method. Can be set to 'ext', 'webrtc' or false to disable.
    desktopSharingChromeMethod: 'ext',
    // The ID of the jidesha extension for Chrome.
    desktopSharingChromeExtId: 'mbocklcggfhnbahlnepmldehdhpjfcjp',
    // The media sources to use when using screen sharing with the Chrome
    // extension.
    desktopSharingChromeSources: ['screen', 'window'],
    // Required version of Chrome extension
    desktopSharingChromeMinExtVersion: '0.1',

    // The ID of the jidesha extension for Firefox. If null, we assume that no
    // extension is required.
    desktopSharingFirefoxExtId: null,
    // Whether desktop sharing should be disabled on Firefox.
    desktopSharingFirefoxDisabled: true,
    // The maximum version of Firefox which requires a jidesha extension.
    // Example: if set to 41, we will require the extension for Firefox versions
    // up to and including 41. On Firefox 42 and higher, we will run without the
    // extension.
    // If set to -1, an extension will be required for all versions of Firefox.
    desktopSharingFirefoxMaxVersionExtRequired: -1,
    // The URL to the Firefox extension for desktop sharing.
    desktopSharingFirefoxExtensionURL: null
}
JitsiMeetJS.init(initOptions);

var connection = null;
var room = null;
var localTracks = [];
var remoteTracks = {};


connection = new JitsiMeetJS.JitsiConnection(null, null, options);

connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED, onConnectionSuccess);
connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_FAILED, onConnectionFailed);
connection.addEventListener(JitsiMeetJS.events.connection.CONNECTION_DISCONNECTED, disconnect);

connection.connect();
