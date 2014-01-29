import json
import urllib
import time
import datetime
import calendar

# Convert date to UNIX timestamp
mindate = "31-07-2012"
mintime = calendar.timegm(time.strptime(mindate, '%d-%m-%Y'))

#Define global variables
service_url = 'https://graph.facebook.com/search'
query='BSNL'
apikey='CAACEdEose0cBAC3mddFlPZBgeTWLR3xQ8dKW7WmWtQEoInlb8Scraf37WaIqverbeHqRbqItjsK80ZAtkJfSb1GY8bhaHhs2peEGGYkYW1nO6USmIJZBDKzZA6BJCZBgW5IpFF3ZBFmVtcs4w3cXf26vQnAjC7r1UkZAeKwsJTgNiZChlWIZBYOSMYCExZAOZBElOYZD'
i=1
hits=0
path=''.join(['facebook/',query]);

#Create db
if not os.path.exists(path):
	os.mkdir(path,0755);	

statfile = open(''.join([path,'/stat.txt']),'w')
details = open(''.join([path,'/details.txt']),'w')

# Fetch Result
params = {
	'q':query,
	'type':'post',
	'fields':'from,link,likes,message',
'since':mintime,
'apikey':apikey
}

#Fetch Response
url = service_url + '?' + urllib.urlencode(params)
url = 'https://graph.facebook.com/search?q=BSNL&type=post&fields=from&since=1343692800&limit=100&access_token=CAATZBdnhk35MBAHEPImJX6kirqEBhwBQ4glm0STH7nAez9bkWZCYo2YXi8DbdzG8j5O5ZCH4EOpGrQ9UNuQ51hhCkofWC6xBcpLXoEfqUCI4sMxfB2AzsFtZA4ZARHfEMCdm50E5m4up7gkzZCe3SvTRFH9Iip0P24kQeRjImVBdaRFch9iYiY'
print url

result=urllib.urlopen(url).read();
response = json.loads(result)

for result in response['data']:
	print result
	break
		
details.close()
statfile.write("hits_total:"+str(hits))	
statfile.close()
