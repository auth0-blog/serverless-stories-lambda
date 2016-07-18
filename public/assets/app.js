AWS.config.region = 'us-east-1'; // Region
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'us-east-1:XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXXX',
    Logins: {
      'cognito-idp.us-east-1.amazonaws.com/us-east-1_XXXXXXXXX': JSON.parse(localStorage.getItem('token'))
    }
});

$(document).ready(function(){
  updateAuthenticationStatus();
  loadAdmin();
});
function logout(){
  localStorage.clear();
  window.location = '/';
};

function updateAuthenticationStatus(){
  $('#user').empty();
  $('#login').empty();
  var user = localStorage.getItem('token');
  if(user){
    $('#user').show().append('<a onclick="logout()">Log out</a>');
    $('#login').hide();
  } else {
    $('#login').show().append('<a href="/login">Log in</a>');
    $('#user').hide();
  }
}

function loadAdmin(){
  if(window.location.pathname == '/admin/'){
    if(localStorage.getItem('token')){
      AWS.config.credentials.get(function (err) {
        var client = apigClientFactory.newClient({
          accessKey: AWS.config.credentials.accessKeyId, 
          secretKey: AWS.config.credentials.secretAccessKey, 
          sessionToken: AWS.config.credentials.sessionToken,
          region: 'us-east-1'  
        });
        client.subscribersGet().then(function(data){
          for(var i = 0; i < data.data.message.length; i++){
            $('#subscribers').append('<h4>' + data.data.message[i].email + '</h4>');
          }
        });
      });
    } else {
      window.location = '/';
    }
  }
}

$('#newsletter').submit(function(e){
  e.preventDefault();

  var client = apigClientFactory.newClient();

  client.subscribePost({}, {email:$('#email').val()}, {})
  .then(function(data){
    if(data.data.statusCode == 200){
      $('#newsletter').hide();
      $('#response').append('<div class="alert alert-success">'+ data.data.message +'</div>')
    } else {
      $('#newsletter').hide();
      $('#response').append('<div class="alert alert-danger">'+ data.data.message +'</div>')
    }
  })

})

$('#signin').submit(function(e){
  e.preventDefault();
  AWSCognito.config.region = 'us-east-1';
  AWSCognito.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'us-east-1_XXXXXXXXX'
  });
  // Need to provide placeholder keys unless unauthorised user access is enabled for user pool
  AWSCognito.config.update({accessKeyId: 'anything', secretAccessKey: 'anything'});

  var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool({ 
    UserPoolId : 'us-east-1_XXXXXXXXX',
    ClientId : 'YOUR-APP-CLIENT-ID'
  });

  var authenticationData = {
    Username : $('#username').val(),
    Password : $('#password').val(),
  };
  var userData = {
    Username : $('#username').val(),
    Pool : userPool
  };
  var authenticationDetails = new AWSCognito.CognitoIdentityServiceProvider.AuthenticationDetails(authenticationData);
  var cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser(userData);

  cognitoUser.authenticateUser(authenticationDetails, {
    onSuccess: function (result) {
      localStorage.setItem('token', JSON.stringify(result.idToken.jwtToken));
      window.location = '/';
    },
    onFailure: function(err) {
      console.log(err);
    }
  });
})