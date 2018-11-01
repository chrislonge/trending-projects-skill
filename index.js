const Alexa = require('ask-sdk-core');
const request = require('request');

let skill;

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speechText = "Welcome to Trending on GitHub. \
    You can find out what's trending in your favorite language by saying, what's trending in Swift. \
    To find out what's trending in all languages just say, what's trending?"

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('Welcome to Trending on GitHub.', speechText)
      .getResponse();
  }
};

const TrendingProjectIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'TrendingProjectIntent';
  },
  handle(handlerInput) {
    return new Promise((resolve, reject) => {
      getTrendingProject((project) => {
        let projectName = project.name;
        const speechText = `Today's trending project on GitHub is called ${projectName}.`;
        resolve(handlerInput.responseBuilder
          .speak(speechText)
          .withSimpleCard('Trending today', speechText)
          .getResponse());
      }, (err, response) => {
        console.log(err);
        reject(err);
      });
    });
  },
}

const TrendingProjectForLanguageIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'TrendingProjectForLanguageIntent';
  },
  handle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    const language = request.intent.slots.language.value
    return new Promise((resolve, reject) => {
      getTrendingProjectForLanguage(language, (project) => {
        let projectName = project.name;
        const speechText = `Today's trending project in ${language} is called ${projectName}.`;
        resolve(handlerInput.responseBuilder
          .speak(speechText)
          .withSimpleCard('Trending today', speechText)
          .getResponse());
      }, (err, response) => {
        console.log(err);
        reject(err);
      });
    });
  },
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speechText = "You can say what's trending? Or what's trending in Swift?";

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .withSimpleCard('Trending on GitHub help', speechText)
      .getResponse();
  }
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speechText = "Goodbye! Come back tommorrow to see what's trending.";

    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard('Goodbye!', speechText)
      .getResponse();
  }
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    //any cleanup logic goes here
    return handlerInput.responseBuilder.getResponse();
  }
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder
      .speak("Sorry, I can't understand the command. Please say again.")
      .reprompt("Sorry, I can't understand the command. Please say again.")
      .getResponse();
  },
};

exports.handler = async (event, context) => {
  console.log(`REQUEST++++${JSON.stringify(event)}`);
  if (!skill) {
    skill = Alexa.SkillBuilders.custom()
      .addRequestHandlers(
        LaunchRequestHandler,
        TrendingProjectIntentHandler,
        TrendingProjectForLanguageIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
      )
      .addErrorHandlers(ErrorHandler)
      .create();
  }

  const response = await skill.invoke(event, context);
  console.log(`RESPONSE++++${JSON.stringify(response)}`);

  return response;
};

// Networking Functions ==========================================================================

const options = {
  uri: 'https://github-trending-api.now.sh/repositories',
  method: 'GET',
  json: true // Automatically parses the JSON string in the response
};

function getTrendingProject(onSuccess, onFailure) {
  request(options, function (error, response, body) {
    if (error) {
      console.log(`Error making request: ${error}`);
      onFailure(error, response)
    }
    
    console.log('github-trending-api response status:', response.statusCode);
    console.log('github-trending-api response data:', body);
    let trendingProject = body[0];
    onSuccess(trendingProject);
  });
}

function getTrendingProjectForLanguage(language, onSuccess, onFailure) {
  request({
    method: 'GET',
    uri: 'https://github-trending-api.now.sh/repositories?language=' + language,
    json: true
  }, function (error, response, body) {
    if (error) {
      console.log(`Error making request: ${error}`);
      onFailure(error, response)
    }

    console.log('github-trending-api response status:', response.statusCode);
    console.log('github-trending-api response data:', body);
    let trendingProject = body[0];
    onSuccess(trendingProject);
  });
}