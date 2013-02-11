out = open('github-reviews.user.js', 'wt')
out.write(open('github-reviews.header.js').read())
out.write(open('lib.js').read())
out.write(open('github-reviews.js').read())

out = open('jira-reviews.user.js', 'wt')
out.write(open('jira-reviews.header.js').read())
out.write(open('lib.js').read())
out.write(open('jira-reviews.js').read())
