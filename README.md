![Build status](https://codebuild.eu-west-1.amazonaws.com/badges?uuid=eyJlbmNyeXB0ZWREYXRhIjoiOEhhMGxqU2FwOGZlY1F4VFBRcDdXY21DRjJWSks5WXVYVjlaT01rTlY1SEV0cW9Tb1FnNmZyY0JxQnlSczlFSnkvZVNNYWFBYWUwNUg0ZVhMdTRlOWJ3PSIsIml2UGFyYW1ldGVyU3BlYyI6ImlkbmhGVldvRnowc0dnQXAiLCJtYXRlcmlhbFNldFNlcmlhbCI6MX0%3D&branch=master)

# Quiz Leaderboard

## Requirements
* A service account key from Google Console (https://cloud.google.com/iam/docs/creating-managing-service-account-keys)
* A Google Sheet with access from the service account

## Generating the Google Sheet

### Install the setup script
```
cd server
npm install -g .
```
### Run the setup script
```
quiz_setup -s 1n9Q_079bXaRNxNjiBr4MOYVVEPagqaFNQSyKUYM6UCY -t "My Quiz" -r 5 -j -f
```
#### Options
* `-s` Sheet ID
* `-t` Tab name
* `-r` Number of rounds
* `-j` Switch - whether there will be a joker round
* `-f` Switch - overwrite the tab if it already exists

## Run the leaderboard
Amend the parameters in `docker-compose.yaml` and simply run `docker-compose up -d`. The scoreboard will be available on the port you've mapped.

### Docker compose params
* Sheet ID - the Google Sheet ID for the results
* `-t` Tab name
* `-r` Number of rounds
* `-j` Switch - whether there will be a joker round