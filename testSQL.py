#!/usr/bin/python
import MySQLdb

# Open database connection
db = MySQLdb.connect("localhost","root","nitish","testdb" )

# prepare a cursor object using cursor() method
cursor = db.cursor()

# Use all the SQL you like
#str123 = "INSERT INTO input(service_provider, tweet_month, tweet, tweet_processed, tweet_word_count, mytype, hits) 				   VALUES ('bsnl', '31-12-2012', 'bsnl website hacked by anonymous india http//tco/2m0ipwno ', 'bsnl website hacked by anonymous india http//tco/2m0ipwno ', '7', 'tweet', '27')"
str123 = "Select * from input";
print str123
try:
	cursor.execute(str123)
except:
	print "123"
	
db.commit()	
# print all the first cell of all the rows
#for row in cursor.fetchall() :
    #print row[0]
count = 215    
for page in range(1,count,100):
	print page
