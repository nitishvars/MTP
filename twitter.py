import json
import urllib
import time
import datetime
import calendar
import os, sys

#Define global variables
service_url = 'http://otter.topsy.com/search.json'
query='docomo'
apikey='09C43A9B270A470B8EB8F2946A9369F3' #Otter its own API key
path=''.join(['twitter/',query]);
#date=["31-07-2012","31-08-2012","30-09-2012","31-10-2012","30-11-2012","31-12-2012","31-01-2013","28-02-2013","31-03-2013","30-04-2013"]
date=["28-02-2013","31-03-2013","30-04-2013"]

for curdate in range(0,len(date)-1):
	# Convert date to UNIX timestamp
	mindate = date[curdate]
	mintime = calendar.timegm(time.strptime(mindate, '%d-%m-%Y'))
	maxdate = date[curdate+1]
	maxtime = calendar.timegm(time.strptime(maxdate, '%d-%m-%Y'))
	print mintime
	print maxtime

	#Local Variable
	subpath=''.join([path,'/',str(maxdate)])
	i=1
	hits=0

	#Create db
	if not os.path.exists(path):
		os.mkdir(path,0755);	

	if not os.path.exists(subpath):
		os.mkdir(subpath,0755);

	statfile = open(''.join([subpath,'/stat']),'w')
	details = open(''.join([subpath,'/details']),'w')

	#~ #Fetch Count
	#~ count_url = 'http://otter.topsy.com/searchcount.json'
	#~ 
	#~ params = {
			#~ 'q':query,
			#~ #'allow_lang':'en',
		#~ 'apikey':apikey,
		#~ 'maxtime':maxtime,
		#~ 'mintime':mintime	
	#~ }
	#~ 
	#~ url = count_url + '?' + urllib.urlencode(params)
	#~ result=urllib.urlopen(url).read();
	#~ response = json.loads(result)
	#~ 
	#~ count = response['response']['a']
	#~ print count

	#for page in range(1,count/100+1):
	for day in range(mintime+8640,maxtime,8640):
		# Fetch Result
		params = {
				'q':query,
				#'allow_lang':'en',
			'apikey':apikey,
			'perpage':'1000',
			'maxtime':day,
			'mintime':mintime	
		}
		
		mintime=day
		
		#Fetch Response
		url = service_url + '?' + urllib.urlencode(params)
		#print url

		result=urllib.urlopen(url).read();
		try:
			response = json.loads(result)

			for result in response['response']['list']:
				try:
					#list = ['broadband', 'modem', 'landline', 'tablet'] BSNL
					list = ["japan", "japan's", "NTT", "lte"]
					if any(word in result['content'].lower() for word in list):
						print result['content']
					else:
						myfile = open(''.join([subpath,'/',str(i),'.txt']),'w')
						myfile.write("hits:"+str(result['hits'])+"\n")
						myfile.write("title:"+result['title']+"\n")
						myfile.write("content:"+result['content']+"\n")
						myfile.write("score:"+str(result['score'])+"\n")
						myfile.close()
						
						details.write("hits:"+str(result['hits'])+"\n")
						details.write("title:"+result['title']+"\n")
						details.write("content:"+result['content']+"\n")
						details.write("score:"+str(result['score'])+"\n")	
						
						i=i+1
						hits=hits+result['hits']
				except Exception:
					print i
					os.remove(myfile)
				#except Exception as ex:
					#print response['response']['list']
		except Exception:
			pass
			
		#print response['query']['pages'][result]['fullurl'];#+ ' (' + result['editurl'] + ')'

	details.close()
	statfile.write("hits_total:"+str(hits)+"\n")	
	statfile.write("i:"+str(i))	
	statfile.close()

'''for key, value in response['query'].iteritems():
	print key, value
	if(key==u'fullurl'):
		url=value
		print 'URL:%s'%url
'''

