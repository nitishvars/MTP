import json
import urllib
import time
import datetime
import calendar
import os, sys
import threading

date=["31-05-2012","30-06-2012","31-07-2012","31-08-2012","30-09-2012","31-10-2012","30-11-2012","31-12-2012","31-01-2013", "28-02-2013", "31-03-2013","30-04-2013","31-05-2013","30-06-2013","31-07-2013","31-08-2013","30-09-2013","31-10-2013"]
list = ['broadband', 'modem', 'landline', 'penta', 'tablet', 'TTA', 'Examination', 'Question', 'Paper', 'Data Card',"japan", "japan's", "NTT", "lte"] #BSNL
#date=["31-05-2012","30-06-2012","31-07-2012"]
for curdate in range(0,len(date)-1):
	# Convert date to UNIX timestamp
	mindate = date[curdate]
	mintime = calendar.timegm(time.strptime(mindate, '%d-%m-%Y'))
	maxdate = date[curdate+1]
	maxtime = calendar.timegm(time.strptime(maxdate, '%d-%m-%Y'))
	print mintime
	print maxtime

	#Define global variables
	service_url = 'http://otter.topsy.com/search.json'
	query='vodafone'
	apikey='09C43A9B270A470B8EB8F2946A9369F3' #Otter its own API key
	proxies = {'http': 'http://10.10.78.62:3128'}
	i=1
	hits=0
	traceback_total=0
	path=''.join(['twitter1/',query]);
	subpath=''.join([path,'/',str(maxdate)])

	#Create db
	if not os.path.exists(path):
		os.mkdir(path,0755);	

	if not os.path.exists(subpath):
		os.mkdir(subpath,0755);

	statfile = open(''.join([subpath,'/stat.txt']),'w')
	details = open(''.join([subpath,'/details.txt']),'w')

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
	#~ print url
	#~ result=urllib.urlopen(url,proxies=proxies).read();
	#~ response = json.loads(result)
	
	#~ count = response['response']['total']
	#~ print count

	# Fetch Result
	#for page in range(1,count,100):
	for day in range(mintime+8640,maxtime,8640):
		params = {
				'q':query,
				#'allow_lang':'en',
			'apikey':apikey,
			'perpage':'100',
			'window':'a',
			#'offset':page-1,
			'maxtime':day,
			'mintime':mintime	
		}
		
		#Fetch Response
		urlS = service_url + '?' + urllib.urlencode(params)
		print urlS
		
		resultS=urllib.urlopen(urlS,proxies=proxies).read();
		mintime = day;
		lock= threading.Lock()
		
		try:
			response = json.loads(resultS)
		except:
			print "Issue Loading JSON"
					
		for result in response['response']['list']:
			if result != []:				
				try:
					if any(word in result['content'].lower() for word in list):
						print result['content']
					else:
						lock.acquire() # will block if lock is already held
						
						try:	
							myfile = open(''.join([subpath,'/',str(i),'.txt']),'w')
							myfile.write("hits:::"+str(result['hits'])+"\n")
							myfile.write("title:::"+result['title']+"\n")
							myfile.write("content:::"+result['content']+"\n")
							myfile.write("score:::"+str(result['score'])+"\n")
							myfile.write("author_name:::"+str(result['trackback_author_name'])+"\n")
							myfile.write("mytype:::"+str(result['mytype'])+"\n")
							myfile.write("highlight:::"+str(result['highlight'])+"\n")
							myfile.write("trackback_total:::"+str(result['trackback_total'])+"\n")
							myfile.close()
							
							#~ details.write("hits:"+str(result['hits'])+"\n")
							#~ details.write("title:"+result['title']+"\n")
							#~ details.write("content:"+result['content']+"\n")
							#~ details.write("score:"+str(result['score'])+"\n")	
							#~ details.write("author_name:"+str(result['trackback_author_name'])+"\n")
							#~ details.write("mytype:"+str(result['mytype'])+"\n")
							#~ details.write("highlight:"+str(result['highlight'])+"\n")
							#~ details.write("trackback_total:"+str(result['trackback_total'])+"\n")
							
							i=i+1
							hits=hits+result['hits']
							traceback_total=traceback_total+result['trackback_total']
							print i
						except TypeError:
							print "Unicode Error In"	
						except Exception:
							print "Issue in file writing"
							os.remove(myfile)	
							pass
						finally:
							lock.release() # release lock, no matter what	
				except IOError as e:
					print "I/O error({0}): {1}".format(e.errno, e.strerror)
				except TypeError:
					print "Unicode Error Out"
				except:
					print "Unexpected error:", sys.exc_info()[0]		
			else:
				print "Nothing returned"
			#except Exception as ex:
				#print response['response']['list']
			
		#print response['query']['pages'][result]['fullurl'];#+ ' (' + result['editurl'] + ')'

	#~ details.close()
	statfile.write("hits_total:"+str(hits)+"\n")
	statfile.write("traceback_total:"+str(traceback_total)+"\n")
	statfile.write("i:"+str(i))	
	statfile.close()

'''for key, value in response['query'].iteritems():
	print key, value
	if(key==u'fullurl'):
		url=value
		print 'URL:%s'%url
'''

