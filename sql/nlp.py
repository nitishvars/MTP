#Program to read files from twitter folder and fill input database
#!/usr/bin/python
import MySQLdb
import glob
import os
import re
import spellChecker
import sys
from nltk.tokenize.punkt import PunktWordTokenizer

# Open database connection
db = MySQLdb.connect("localhost","root","nitish","testdb" )

# prepare a cursor object using cursor() method
cursor = db.cursor()

service_provider='aircel';
path=''.join(['../twitter1/',service_provider]);
end_dates = [ name for name in os.listdir(path) if os.path.isdir(os.path.join(path, name)) ];
os.chdir(''.join([path,'/',end_dates[0]]));

sql_error = open('sql.txt','w');
file_error = open('file.txt','w');

for end_date in end_dates:
	subpath = ''.join(['../',end_date]);
	os.chdir(subpath);
	for files in glob.glob("*.txt"):	
		if files != 'details.txt' and files != 'stat.txt':
			myfile = open(files,'r');
			filecontent = myfile.read();
			print files;
			
			line2 = [m.start()+8 for m in re.finditer('title:::', filecontent)]; #+6 for removing title:
			line3 = [m.start()-1 for m in re.finditer('content:::', filecontent)]; #-1 to remove content
			line6 = [m.start()+9 for m in re.finditer('mytype:::', filecontent)]; #+7 for removing mytype
			line7 = [m.start()-1 for m in re.finditer('highlight:::', filecontent)]; #-1 to remove content
			line8 = [m.start()+18 for m in re.finditer('trackback_total:::', filecontent)]; #+7 for removing trackback_total:
			
			if len(line2) != 0:
				try:
					titleSt = line2[0];
					titleEn = line3[0];
					mytypeSt = line6[0];
					mytypeEn = line7[0];
					hitSt = line8[0];
					
					title = filecontent[titleSt:titleEn];
					mytype = filecontent[mytypeSt:mytypeEn];
					hits = int(filecontent[hitSt:len(filecontent)].strip());
					
					#added on 3Feb to tackle issue like don't isn't
					punctuation = re.compile(r'[\']') 
					title = punctuation.sub("",title.lower());
					title = title.replace("smart phone","smartphone");
					
					#word_list = re.split('\s+', title.lower());
					word_list = PunktWordTokenizer().tokenize(title);
					#Remove words starting with @ : Dont do this due to eg like @ aircel csk is destroying all the ipl teams in a legal way but aircel is exploiting their customers in a more better way corrupt @ aircel 
						#WordsStartingWithAlpha = re.findall(r'[@]\S*',title);
						#for word in WordsStartingWithAlpha:
							#title = title.replace(word,"");
					text, processed_text = spellChecker.correct(word_list);
					# Prepare SQL query to INSERT a record into the database.
					sql = "INSERT INTO input(service_provider, tweet_month, tweet, tweet_processed, tweet_word_count, mytype, hits) \
						   VALUES ('%s', '%s', '%s', '%s', '%d', '%s', '%d')" % \
						   (service_provider, end_date,	text, processed_text, len(word_list), mytype, hits)
				except:
					print "23";
					file_error.write(end_date + " " + files + "\n");
				
				try:	 
				    # Execute the SQL command
					cursor.execute(sql)
				   #print text + "\n" + processed_text
				except:
				   # Rollback in case there is any error
				   # db.rollback()
				   sql_error.write(sql + "\n");
				   print sql
		   		   
	# Commit your changes in the database
	db.commit()
	print "Commit successfull"
# disconnect from server
file_error.close()
sql_error.close()
db.close()
