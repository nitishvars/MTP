import collections
from nltk.corpus import wordnet as wn
from sets import Set

s = wn.synsets('like')
t = []
for ss in s:
	a = ss.name.split('.')
	b = a[0]
	t.append(b)

a1 = Set(t)
print a1
for z in a1:
	print z

def synset(word_list):
	wordset = collections.defaultdict(lambda: 1)
	for word in word_list:
		s = wn.synsets(word)
		for ss in s: #ss is synset
			syn = ss.name.split('.')[0];
			wordset[syn] = 1;
	return list(wordset)
	
serviceNegClass1 = ["pathetic","shittiest","no","worst"];
a = synset(serviceNegClass1)
print a	
