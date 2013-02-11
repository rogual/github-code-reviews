github-code-reviews
===================

Code review features for Github on Chrome.

1. Download the **github-reviews.user.js** file
2. Open the Chrome Extensions page and drag the .js file to it.
3. Go to GitHub.com. You should be asked for your access token.
4. Type in your access token.

To create your access token:

    curl https://api.github.com/authorizations -d "{\"scopes\":[\"repo\"]}" -u YOUR-GITHUB-USER-NAME

Then enter your password. You should get some JSON back. Your access token
will be in the field named "token".

You can manage your tokens through the GitHub web interface.

JIRA support
============

1. Download the **jira-reviews.user.js** file
2. Open the Chrome Extensions page and drag the .js file to it.
3. Go to your JIRA RapidBoard. You should be asked for your access token.
4. Type in your access token.
5. You should be asked for your GitHub organization name.
6. Type in your GitHub organization name.
