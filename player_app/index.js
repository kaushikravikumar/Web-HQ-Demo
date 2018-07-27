var pubnub;

var optionChosen;

var buttonOptionA;
var buttonOptionB;
var buttonOptionC;
var buttonOptionD;

const grant_access_url = "https://pubsub.pubnub.com/v1/blocks/sub-key/sub-c-6a727412-91c6-11e8-b36b-922642fc525d/grantAccess";

const subscribe_key = "sub-c-6a727412-91c6-11e8-b36b-922642fc525d";

const publish_key = "pub-c-e8c60862-b990-42c1-add2-49acc66f1b4c";

/**
 * Randomly generate UUID for user, then grant access for it!
 */
window.onload = function() {
    if (localStorage.getItem('accessToken') == null) {
        var uuid = generate_UUID();
        var req_options = {
          "body": {
              "uuid": uuid
          }
        };
        return request(grant_access_url, 'POST', req_options).then((response) => {
          console.log(response);
            if (response.status === 200) {
                console.log('ACCESS GRANTED');
                localStorage.setItem('accessToken', uuid);
            } else {
                console.log('ACCESS DENIED');
            }
        });
    }
    initPubNub();
};

function generate_UUID() {
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + Math.random() * 16) % 16 | 0;
        dt = Math.floor(dt / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
}

function initPubNub() {
    pubnub = new PubNub({
        subscribeKey: subscribe_key,
        publishKey: publish_key,
        uuid: localStorage.getItem('accessToken'),
        authKey: localStorage.getItem('accessToken'),
        ssl: true
    });
    updateUI();
}

function updateUI()
{
  pubnub.addListener({
      message: function(m) {
          var msg = m.message; // The Payload
          var channelName = m.channel; // The channel for which the message belongs
          if(channelName === 'question_post')
          {
              showQuestion(msg);
          }
          else if(channelName === 'answer_post')
          {
              showCorrectAnswer(msg);
              showAnswerResults(msg);
          }
      },
      presence: function(p) {

      },
      status: function(s) {

      }
  });
  pubnub.subscribe({
      channels: ['question_post', 'answer_post'],
  });
  pubnub.hereNow(
    {
        channels: ['question_post'],
        includeUUIDs: true
    },
    function (status, response) {
        document.getElementById('num_players').innerHTML = response.totalOccupancy;
    }
);

buttonOptionA = document.getElementById("optionA");
buttonOptionB = document.getElementById("optionB");
buttonOptionC = document.getElementById("optionC");
buttonOptionD = document.getElementById("optionD");

buttonOptionA.addEventListener("click", optionASelected);
buttonOptionB.addEventListener("click", optionBSelected);
buttonOptionC.addEventListener("click", optionCSelected);
buttonOptionD.addEventListener("click", optionDSelected);
}

function showQuestion(msg)
{
    document.getElementById('question').innerHTML = msg.question;
    buttonOptionA.innerHTML = msg.optionA;
    buttonOptionB.innerHTML = msg.optionB;
    buttonOptionC.innerHTML = msg.optionC;
    buttonOptionD.innerHTML = msg.optionD;

    var timeleft = 10;
    var gameTimer = setInterval(function() {
    document.getElementById("seconds").innerHTML = --timeleft;
    // Timer done!!
    if (timeleft <= 0) {
        clearInterval(gameTimer);
        // SUBMIT ANSWER!!
        submitAnswer(optionChosen);
        document.getElementById('answerOptions').style.visibility = "hidden";
      }
    }, 1000);
}

function submitAnswer(optionChosen)
{
  return pubnub.fire({
          channel: "submitAnswer",
          message: {
            "answer": optionChosen
          },
          sendByPost: false,
      }).then((publishResponse) => {
          console.log(publishResponse.toString);
      });
}

function showCorrectAnswer(msg)
{

}

function showAnswerResults(msg)
{

}

function optionASelected()
{
  optionChosen = "optionA";
  buttonOptionA.classList.add("selected");
  buttonOptionB.classList.remove("selected");
  buttonOptionC.classList.remove("selected");
  buttonOptionD.classList.remove("selected");
}

function optionBSelected()
{
  optionChosen = "optionB";
  buttonOptionA.classList.remove("selected");
  buttonOptionB.classList.add("selected");
  buttonOptionC.classList.remove("selected");
  buttonOptionD.classList.remove("selected");
}

function optionCSelected()
{
  optionChosen = "optionC";
  buttonOptionA.classList.remove("selected");
  buttonOptionB.classList.remove("selected");
  buttonOptionC.classList.add("selected");
  buttonOptionD.classList.remove("selected");
}

function optionDSelected()
{
  optionChosen = "optionD";
  buttonOptionA.classList.remove("selected");
  buttonOptionB.classList.remove("selected");
  buttonOptionC.classList.remove("selected");
  buttonOptionD.classList.add("selected");
}


/**
 * Helper function to make an HTTP request wrapped in an ES6 Promise.
 *
 * @param {String} url URL of the resource that is being requested.
 * @param {String} method POST, GET, PUT, etc.
 * @param {Object} options JSON Object with HTTP request options, "header"
 *     Object of possible headers to set, and a body Object of a request body.
 *
 * @return {Promise} Resolves a parsed JSON Object or String response text if
 *     the response code is in the 200 range. Rejects with response status text
 *     when the response code is outside of the 200 range.
 */
function request(url, method, options) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        let contentTypeIsSet = false;
        options = options || {};
        xhr.open(method, url);
        for (let header in options.headers) {
            if ({}.hasOwnProperty.call(options.headers, header)) {
                header = header.toLowerCase();
                contentTypeIsSet = header === 'content-type' ? true : contentTypeIsSet;
                xhr.setRequestHeader(header, options.headers[header]);
            }
        }
        if (!contentTypeIsSet) {
            xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        }
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                let response;
                try {
                    response = JSON.parse(xhr.response);
                } catch (e) {
                    response = xhr.response;
                }
                resolve(response);
            } else {
                reject({
                    status: xhr.status,
                    statusText: xhr.statusText,
                });
            }
        };
        xhr.send(JSON.stringify(options.body));
    });
}
