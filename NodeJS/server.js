var result = "";
var flag = 0;
const jwt = require('jsonwebtoken');
const config = require('./config');
const PubNub = require('pubnub');

//Use the ApiKey and APISecret from config.js
const payload = {
    iss: config.APIKey,
    exp: ((new Date()).getTime() + 5000)
};
const token = jwt.sign(payload, config.APISecret);
const rp = require('request-promise');
const email = config.email;

async function StartZoomMeeting() {
    const options = {
        method: "POST",
        uri: "https://api.zoom.us/v2/users/" + email + "/meetings",
        body: {
            topic: "test create meeting",
            type: 1,
            settings: {
                host_video: "true",
                participant_video: "true",
                approval_type: 0
            }
        },
        auth: {
            bearer: token
        },
        headers: {
            "User-Agent": "Zoom-api-Jwt-Request",
            "content-type": "application/json"
        },
        json: true //Parse the JSON string in the response
    };

    try {
        const response = await rp(options);
        result = JSON.stringify(response);
        result = JSON.parse(result);
        //console.log(result.start_url);

        var proc = require('child_process').spawn("xdg-open", [result.start_url]);

        function killBrowser(arg) {
            console.log(`arg=> ${arg}`);
            proc.kill('SIGINT');
        }
        setTimeout(killBrowser, 15000, 'close browser');

        publishMessage(result.join_url);
    } catch (error) {
        console.log("API call failed, reason ", error);
    }
}

async function UpdateZoomMeeting(meetingID) {
    const options = {
        // To update the meeting ID with status 'end'
        method: "PUT",
        uri: "https://api.zoom.us/v2/meetings/" + meetingID + "/status",
        body: {
            "action": "end"
        },
        auth: {
            bearer: token
        },
        json: true //Parse the JSON string in the response
    };
    try {
        const response = await rp(options);
        return Promise.resolve("OK");
    } catch (error) {
        return Promise.reject("error");
    }
}

const pubnub = new PubNub({
    publishKey: "PUBNUB_PUBLISH_KEY",
    subscribeKey: "PUBNUB_SUBSCRIBE_KEY",
    uuid: "RANDOM_STRING",
});

async function publishMessage(msg) {
    const result = await pubnub.publish({
        channel: "sac_feed",
        message: {
            feedback: msg
        },
    });
    console.log(result);
}

pubnub.addListener({
    status: function(statusEvent) {
        if (statusEvent.category === "PNConnectedCategory") {
        }
    },
    message: async function(messageEvent) {
        let cmd = messageEvent.message.cmd;
        console.log(cmd);

        if (cmd === 'create') {
            if (flag === 0) {
                console.log("here you go - initiate call");
                flag = 1;
                StartZoomMeeting();
            } else {
                console.log('error: can\'t initiate call');
                publishMessage('cant_create');
            }
        }
        if (cmd === 'end') {
            try {
                var response = await UpdateZoomMeeting(result.id);

                if (response === "OK") {
                    publishMessage('terminated');
                    flag = 0;
                } else {
                    publishMessage('cant_terminated');
                    flag = 0;
                }
            } catch (err) {
                console.log('error: can\'t terminate call');
                publishMessage('cant_terminated');
                flag = 0;
            }
        }
    },
    presence: function(presenceEvent) {
        // handle presence
    },
});

console.log("Subscribing..");

pubnub.subscribe({
    channels: ["sac"],
});
