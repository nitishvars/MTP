#Program to read feeds from input table and fills output table.
#It uses classTester.py for actual classification
#!/usr/bin/python
import MySQLdb
import classTester

#Find function to exactly match a given word
def myfind(tweet, word):
	pos = tweet.find(word);
	if pos != -1 and (tweet[pos-1]==' ' or pos == 0) and ( len(tweet)==pos+len(word) or tweet[pos+len(word)] == ' '  or tweet[pos+len(word)] == '.'):
		return pos;
	else:
		return -1;
		
# Open database connection
db = MySQLdb.connect("localhost","root","nitish","testdb" )

# prepare a cursor object using cursor() method
cursor1 = db.cursor()

# Prepare SQL query to RETRIEVE records from the database.
sqlR = "SELECT `id`, `service_provider`, `tweet`, `tweet_processed` FROM `input` ";

# List of all service providers in India
all_service_provider = ["bsnl", "mtnl", "aircel", "airtel", "vodafone", "idea", "docommo", "docomo", "indicom", "MTS", "virgin", "reliance", "uninor", "loop", "videocon"];
	
try:
   # Execute the SQL command
   cursor1.execute(sqlR);
   # Fetch all the rows in a list of lists.
   results = cursor1.fetchall();
   cursor2 = db.cursor();
except:
   print "Error: unable to fetch data"	

serv_prov_file = open('service provider.txt','a+');

for id,service_provider,tweet,tweet_parsed in results:
	other_service_provid = [x for x in all_service_provider if x != service_provider.lower()];
	isOtherServiceProvid = [x for x in other_service_provid if myfind(tweet_parsed.lower(),x) != -1];
	
	isServiceProvider = myfind(tweet_parsed,service_provider.lower());
	
	if isOtherServiceProvid != [] and isServiceProvider != -1:
		serv_prov_file.write(str(id)+"\t"+tweet+"\n")
	
# disconnect from server
db.close()
