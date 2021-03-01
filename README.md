Gmail web interface does not support partial word search. This add-on tries to
workaround the issue by implementing a Google Workspace add-on.

It's quite slow because there is no Gmail API method to get a list of message
subjects or bodies. So each individual message has to be pulled using separate
API calls. To avoid timeouts, one search inspects 50 threads. Then you have to
click a button to continue with the next 50 threads.

I have created this because users in one organization needed to find e-mails
based on sequences of numbers. The problem was that these numbers could be
prefixed or suffixed with random letters, so Gmail's search didn't work.
