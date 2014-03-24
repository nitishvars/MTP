#Program to read feeds from input table and fills output table.
#It uses classTester.py for actual classification
#!/usr/bin/python
import MySQLdb
import classTesterWithProx

# Open database connection
db = MySQLdb.connect("localhost","root","nitish","testdb" )

# prepare a cursor object using cursor() method
cursor1 = db.cursor()

# Prepare SQL query to RETRIEVE records from the database.
sqlR = "SELECT `id`, `service_provider`, `tweet_month`, `tweet_processed` FROM `input` ";

try:
   # Execute the SQL command
   cursor1.execute(sqlR);
   # Fetch all the rows in a list of lists.
   results = cursor1.fetchall();
   cursor2 = db.cursor();
except:
   print "Error: unable to fetch data"	

for tid,service_provider,tweet_date,tweet_parsed in results:
	positive_score, negative_score, neutral_score, isPrice, isService, isSatis, isMisc = classTesterWithProx.classifier(tweet_parsed, service_provider);
	#print str(tid)+ " "+ str(positive_score) + " " + str(negative_score) + " " + str(neutral_score) + " " + str(isPrice) + " " + str(isService) + " " + str(isSatis) + " " + str(isMisc)
	   
	sqlI = "INSERT INTO output(tid, service_provider, tweet_month, is_positive, is_negative, is_neutral, isPrice, isService, isSatisfaction, isMiscellaneous) \
			VALUES ('%d', '%s', '%s', '%d', '%d', '%d', '%d', '%d', '%d', '%d')" % \
			(tid, service_provider, tweet_date,	positive_score, negative_score, neutral_score, isPrice, isService, isSatis, isMisc)
	#output2 has 10 proximity dt and output1 has 5 and output has 3.
	try:   	   					
		cursor2.execute(sqlI);
		# Commit your changes in the database
		db.commit();
		print str(tid)+ " "+ str(positive_score) + " " + str(negative_score) + " " + str(neutral_score) + " " + str(isPrice) + " " + str(isService) + " " + str(isSatis) + " " + str(isMisc)
	except:
		# Rollback in case there is any error
		db.rollback()
	
# disconnect from server
db.close()
