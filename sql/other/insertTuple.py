#!/usr/bin/python
import MySQLdb

# Open database connection
db = MySQLdb.connect("localhost","root","nitish","testdb" )

# prepare a cursor object using cursor() method
cursor = db.cursor()

service_provider="Aircel"
# Prepare SQL query to INSERT a record into the database.
sql = "INSERT INTO result(service_provider, \
       time, market_share, users, tweets) \
       VALUES ('%s', '%s', '%f', '%d', '%d' )" % \
       (service_provider, "Apr,2013",	6.93,	60080216,	3077)
try:
   # Execute the SQL command
   cursor.execute(sql)
   # Commit your changes in the database
   db.commit()
   print "Insertion successfull"
except:
   # Rollback in case there is any error
   db.rollback()
   print "not successfull"


# disconnect from server
db.close()
