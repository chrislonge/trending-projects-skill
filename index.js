const Alexa = require('ask-sdk-core');
const request = require('request');

let skill;

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(welcomeMessage)
      .reprompt(repromptMessage)
      .withSimpleCard('Welcome to Trending on GitHub.', welcomeMessage)
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
        let description = project.description;
        let language = project.language;
        const speechText = `Today's trending project is a ${language} project called ${projectName}. \
          Here's a short description. ${description}. <break time="2s"/> \
          To here what's trending in a specific programming language, just say the language.`;
        resolve(handlerInput.responseBuilder
          .speak(speechText)
          .reprompt(repromptMessage)
          .withSimpleCard('Trending today', speechText)
          .getResponse());
      }, (err, response) => {
        console.log(`Error: ${err}\nResponse: ${response}`);
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
        let description = project.description;
        const speechText = `Today's trending project in ${language} is called ${projectName}. \
          Here's a short description. ${description} <break time="2s"/> \
          To here what's trending in another programming language, just say the language.`;
        resolve(handlerInput.responseBuilder
          .speak(speechText)
          .reprompt(repromptMessage)
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
    return handlerInput.responseBuilder
      .speak(helpMessage)
      .reprompt(helpMessage)
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

// Constants =====================================================================================

const welcomeMessage = `Welcome to Trending on GitHub. \
  You can find out what's trending in your favorite programming language's. For example, say What's trending in Swift. \
  To find out what's trending in all languages just say, what's trending?`;
const repromptMessage = `Which programming language would you like to hear about?`;
const helpMessage = `You can say what's trending? Or what's trending in Swift?`;

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
      onFailure(error, response);
    }
    
    console.log('github-trending-api response status:', response.statusCode);
    console.log('github-trending-api response data:', body);
    // Array does not exist or is not an array, or is empty.
    if (!Array.isArray(body) || !body.length) {
      console.log('Recieved incorrect object, or an empty array...');
      onFailure(null, response);
    }
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