github-code-reviews
===================

Code review features for Github on Chrome.

1. Download the .user.js file
2. Edit it, replacing 'your access token here' with your access token
3. Open the Chrome Extensions page
4. Drag the js file to it.

To create your access token:

    curl https://api.github.com/authorizations -d "{\"scopes\":[\"repo\"]}" -u YOUR-GITHUB-USER-NAME

Then enter your password. You should get some JSON back. Your access token
will be in the field named "token".

You can manage your tokens through the GitHub web interface.
