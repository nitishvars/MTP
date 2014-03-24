import java.awt.*;
import java.awt.event.*;  // using AWT events and listener interfaces
import java.io.File;
import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import javax.swing.*;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.LinkedList;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;

class Node
{
 String label;
 int count;
 List<Node> children = new LinkedList<Node>();
 
 @Override
	public int hashCode() {
		return label.hashCode();
	}
 
 @Override
	public boolean equals(Object obj) {
		Node other = (Node)obj;
		return other.label.equals(label);
	}
 
 	public List<List<String>> findPaths(String label) 
 	{
	    List<List<String>> result = new ArrayList<List<String>>();

	    if (label.equals(this.label)) {
	    	//System.out.println(this.count+"");
	    	List<String> path = new ArrayList<String>();
	    	path.add(this.label+":"+this.count);
	        result.add(path);
	    }

	    for (Node child : children) {
	        for (List<String> subResult : child.findPaths(label)) {
	            // add this.label in front
	            List<String> path = new ArrayList<String>();
	            if(this.label!=null)
	            	path.add(this.label);
	            path.addAll(subResult);
	            result.add(path);
	        }
	    }

	    return result;
 	}
}

public class tfp extends JFrame implements WindowListener,ActionListener
{
	//private Map<String, Set<String>> myNodes = new LinkedHashMap<String, Set<String>>();
	private JTextField filePath, itemPerTrans, minl, K, minSup;  // single-line TextField
    private TextArea taDisplay; // multi-line TextArea to taDisplay result
    private Container c=getContentPane();
    private JPanel leftPan  = new JPanel();
    private JPanel leftPanT = new JPanel();
    private JPanel leftPanB = new JPanel();
    private JPanel rightPan = new JPanel();
    private JLabel filePathL;
    private JButton start, browse;
    
    private Map<Integer,Integer> sortedItems = new LinkedHashMap<Integer, Integer>();
    private ArrayList<Boolean> transToCheck = new ArrayList<Boolean>();
    private ArrayList<String> topK = new ArrayList<String>();
    
    public tfp() 
    {
    	leftPan.setLayout(new GridLayout(3,1));
    	leftPan.setBorder(BorderFactory.createMatteBorder(0, 0, 0, 2, Color.black));
    	leftPanT.setLayout(new GridLayout(5,2,5,5));
    	leftPanB.setLayout(new FlowLayout());
    	rightPan.setLayout(new FlowLayout());
    	
    	filePathL = new JLabel("Choose DB:");
    	filePathL.setToolTipText( "Enter the path of file where it is stored" );
    	browse = new JButton("Choose DB");
    	browse.addActionListener(this);
    	leftPanT.add(browse);   	
    	filePath = new JTextField();
    	leftPanT.add(filePath);
    	
    	leftPanT.add(new JLabel("Number of items per transaction :"));
    	itemPerTrans = new JTextField(3); // 676 is limit on number of items per transactions
    	leftPanT.add(itemPerTrans);
    	leftPanT.add(new JLabel("Minimum length of each itemset :"));
    	minl = new JTextField(3); // Can not be more than 100%
    	leftPanT.add(minl);
    	leftPanT.add(new JLabel("Top K :"));
    	K = new JTextField(4); // Can not be more than 100%
    	leftPanT.add(K);
    	leftPanT.add(new JLabel("Minimum Support :"));
    	minSup = new JTextField(4); // Can not be more than 100%
    	leftPanT.add(minSup);
    	
    	start = new JButton("Start");
    	start.addActionListener(this);
    	leftPanB.add(start);
    	
    	leftPan.add(leftPanT);
    	leftPan.add(leftPanB);
    	
    	taDisplay = new TextArea(15, 30); // 5 rows, 40 columns
    	JScrollPane scrollPane = new JScrollPane(taDisplay);
    	scrollPane.setAutoscrolls(false);
    	String msg = "TFP : An efficient Algorithm for Mining top-K frequent closed Itemset\n";
    	taDisplay.setText( msg + "== Run Info \n");
    	taDisplay.setForeground(Color.red);
    	Font font1 = new Font("Book Antiqua", Font.PLAIN, 15);
    	taDisplay.setFont(font1);
    	taDisplay.setEditable(false);
    	
    	rightPan.add(scrollPane);
    	
    	c.setLayout(new GridLayout(1,2)); 
    	c.add(leftPan);
    	c.add(rightPan);	
      	
      	addWindowListener(this);
      	
      	setTitle("TFP algorithm Implementation"); 
        setSize(800, 400);        
        setVisible(true);         
        setLocation(220,150);
		setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
    }
    
	public static void main(String args[])
	{
		new tfp();  // Let the constructor do the job 
	    log("Hello World !");
	}
	
	/** WindowEvent handlers */
   // Called back upon clicking close-window button
   @Override
   public void windowClosing(WindowEvent e) {
      System.exit(0);  // terminate the program
   }
 
   // Not Used, but need to provide an empty body for compilation
   @Override
   public void windowOpened(WindowEvent e) { }
   @Override
   public void windowClosed(WindowEvent e) { }
   @Override
   public void windowIconified(WindowEvent e) { }
   @Override
   public void windowDeiconified(WindowEvent e) { }
   @Override
   public void windowActivated(WindowEvent e) { }
   @Override
   public void windowDeactivated(WindowEvent e) { }
   
   public void actionPerformed(ActionEvent e) 
   {
	   if(e.getSource()== browse)
		{
			JFileChooser jfc=new JFileChooser("Open"); 
			try{
				jfc.showOpenDialog(null);
				File file=jfc.getSelectedFile();
				filePath.setText(file.getPath());
				itemPerTrans.requestFocusInWindow();
			}catch(Exception ex){}  
		}
	   else if(e.getSource() == start)
		{
		   textFieldErrorTest(676, itemPerTrans);
		   textFieldErrorTest(Integer.parseInt(itemPerTrans.getText()), minl);
		   textFieldErrorTest(Integer.parseInt(itemPerTrans.getText()),K);
		   textFieldErrorTest(Integer.parseInt(itemPerTrans.getText()),minSup);
		   
		   sort_frequent_1_itemsets();
		   create_fp_tree();
		}
   }
   
   private void sort_frequent_1_itemsets()
   {
	   int m = Integer.parseInt(itemPerTrans.getText());
	   Integer[][] item = new Integer[m][2];
	   
	   for(int i=0; i<m; i++)
	   {
		   item[i][0] = i;
		   item[i][1] = 0;
	   }
	   
	   BufferedReader br = null;
	   String sCurrentLine;
	   
	   try
	   {
		   br = new BufferedReader(new FileReader(filePath.getText()));
		   while ((sCurrentLine = br.readLine()) != null) 
		   {	
			    int noOfItems = 0;
				for(int i=0; i<m; i++)
				{
					if(sCurrentLine.charAt(i) == '1')
					{
						item[i][1]=item[i][1]+1;
						noOfItems++;
					}
				}
				
				if(noOfItems < Integer.parseInt(minSup.getText()))
					transToCheck.add(false);
				else
					transToCheck.add(true);
			}
	   }catch (IOException ex){ ex.printStackTrace(); } 
		 finally
		 {
			Arrays.sort(item, new Comparator<Integer[]>() {
			    public int compare(Integer[] int1, Integer[] int2) {
			        Integer numOfKeys1 = int1[1];
			        Integer numOfKeys2 = int2[1];
			        return numOfKeys1.compareTo(numOfKeys2);
			    }
			});
			//dump(item);
			for(int i=m-1; i>=0; i--)
			{
				sortedItems.put(item[i][0],item[i][1]);
				log(getCharForNumber(item[i][0])+ "     "+item[i][1]);
			}
			try 
			{
				if (br != null)br.close();
			}catch (IOException ex){ ex.printStackTrace(); }
		 }  
   }
   
   private void create_fp_tree()
   {
	   BufferedReader br = null;
	   String sCurrentLine;
	   Node root = new Node();
	   log("=======\nMaking FP tree\n=======");
	   
	   try
	   {
		   br = new BufferedReader(new FileReader(filePath.getText()));
		   int lineNum=0;
		   while ((sCurrentLine = br.readLine()) != null) 
		   {	
			   if(transToCheck.get(lineNum) == false)
			   { 
				   // Transaction reduction
			   }
			   else
			   {   
				   //order(sCurrentLine)
				   String trans="";
				   for (Map.Entry<Integer, Integer> entry : sortedItems.entrySet()) 
					{
					   if(sCurrentLine.charAt(entry.getKey()) == '1')
						{
							trans=trans+getCharForNumber(entry.getKey())+";";
						}
					}
				   log(trans);
				   
				   //Create FP-tree
				   String[] parts = trans.split(";");
				   Node curLevel = root;
				   for(int i=0; i<parts.length; i++)
				   {
					    Node toBeAdded = new Node();
					    toBeAdded.label=parts[i];
					    int index = curLevel.children.indexOf(toBeAdded);
					    
				        if(index == -1)
				        {
				        	Node leaf = new Node();
				        	leaf.label = parts[i];
				        	leaf.count = 1;
				        	curLevel.children.add(leaf);
				        	
				        	//log(leaf.label+"'s parent is "+curLevel.label);
				        	curLevel = leaf;
				        }
				        else
				        {
				        	Node node = curLevel.children.get(index);
				        	node.count = node.count + 1;
				        	//curLevel.children.add(index, node);
				        	
				        	//log(node.label+" count is now = " + node.count+" & its parent is "+curLevel.label);
				        	curLevel = node;
				        }
				   }
			   }
			   lineNum++;
			}
		   
		   log("=======\nFinal FP tree\n=======");
		   printTree(root,"");
		   
		   //Make maximal frequent itemset
		   int frequentItemsetFound = 0;
		   
		   for (Map.Entry<Integer, Integer> entry : sortedItems.entrySet()) 
		   {
			   List<List<String>> paths = root.findPaths(getCharForNumber(entry.getKey()));
			   for (List<String> path : paths) {
				    System.out.print("Path for "+getCharForNumber(entry.getKey())+" : ");
			        printPath(path);
			    }
			   
			   if(entry.getValue() >= Integer.parseInt(minSup.getText()))
			   {	   
				   if(paths.size() == 1)
				   {
					   if(paths.get(0).size() >= Integer.parseInt(minl.getText()))
					   {
						   //log(paths.get(0).get(paths.get(0).size()-1));
						   String[] parts = paths.get(0).get(paths.get(0).size()-1).split(":");
						   if( Integer.parseInt(parts[1]) >= Integer.parseInt(minSup.getText()) )
						   {
							   //log(paths.get(0).toString());
							   topK.add(paths.get(0).toString());
							   frequentItemsetFound++;
							   
							   if(frequentItemsetFound >= Integer.parseInt(K.getText()))
							   {
								   minSup.setText(parts[1]);
							   }
						   }
					   }
					   //log(paths.get(0).size()+"");
				   }	   
				   if(paths.size() > 1)
				   {
					   List<String> lcsList = new ArrayList<String>();
					   for (int i=0;i<paths.size();i++) 
					   {
						   for (int j=i+1;j<paths.size();j++) 
						   {						   
							   lcsList.add(lcs(paths.get(i),paths.get(j)));
						   }
					   }
					   
					   Map<String,Integer> items = new LinkedHashMap<String, Integer>();
					   for(String subSeq: lcsList)
					   {
						   String[] parts = subSeq.split(",");
						   
						   for(List<String> path : paths)
						   {
							   boolean flag = false;
							   for(int index=0; index<parts.length-1; index++)
							   {
								   if(!path.contains(parts[index]))
									   flag = true;
							   }
							   if(flag == false) //String is sublist of path
							   {
								   String[] lastItemParts = path.get(path.size()-1).split(":");

								   if(items.containsKey(subSeq))
								   {
									   int value = items.get(subSeq);
									   value = value + Integer.parseInt(lastItemParts[1]);
									   items.put(subSeq, value);
									   //log(subSeq+"   "+value);
								   }
								   else
								   {
									   items.put(subSeq, Integer.parseInt(lastItemParts[1]));
								   }   
							   }
							   
							   String pathStr = "";
							   for(int index=0; index<path.size()-1;index++)
								   pathStr = pathStr + path.get(index) + ",";
							   String[] partsNew = path.get(path.size()-1).split(":");
							   pathStr = pathStr + partsNew[0];
							   
							   if(!items.containsKey(pathStr))
							   {
								   items.put(pathStr, Integer.parseInt(partsNew[1]));
								   //log(pathStr+"  "+partsNew[1]);
							   }
						   }
					   }
					   
					   Iterator it = items.entrySet().iterator();
					   while(it.hasNext()) 
					   {
						   Map.Entry me = (Map.Entry)it.next();
						   int cost = (int)me.getValue();
						   if( cost >= Integer.parseInt(minSup.getText()) ) 
						   {
							   String key = (String)me.getKey();
							   String[] parts = key.split(",");
							   if(parts.length >= Integer.parseInt(minl.getText()))
							   {
								   topK.add(key+":"+cost);
								   frequentItemsetFound++;
								   
								   if(frequentItemsetFound >= Integer.parseInt(K.getText()))
								   {
									   minSup.setText(cost+"");
								   }
							   }	   
						   }	   
					   }
				   }
			   }   
		   }
		   
		   log("=======\nTop K Rules\n=======");
		   for(String frequent: topK)
		   {
			   log(frequent);
		   }	   
	   }catch (IOException ex){ ex.printStackTrace(); } 
   }
   
   private void printPath(List<String> path)
   {
	   for(int i=0;i<path.size();i++)
		     System.out.print(path.get(i)+";");
	   log("");
   }
   
   private void printTree(Node node, String whitespace)
   {
	   if(node != null)
	   {
		   log(whitespace+node.label+" count = "+node.count);
		   List<Node> children = node.children;
	       if (children != null) 
	       {
	           for (Node child: children) 
	           {
	               printTree(child, whitespace+"\t");
	           }
	       }
	   }
   }
   
   private String lcs(String a,String b) 
   {
	      String x;
	      String y;

	      int alen=a.length();
	      int blen=b.length();
	      if (alen==0 || blen==0) {
	        return "";
	      }
	      else if (a.charAt(alen-1)==b.charAt(blen-1)){
	    	  return lcs(a.substring(0,alen-1),b.substring(0,blen-1)) + a.charAt(alen-1);
	    	}
	      else {
	        x=lcs(a,b.substring(0,blen-1));
	        y=lcs(a.substring(0,alen-1),b);
	      }
	      return (x.length()>y.length()) ? x : y;
   }
   
   private String lcs(List<String> a,List<String> b) 
   {							
	      String x;
	      String y;

	      int alen=a.size();
	      int blen=b.size();
	      
	      if (alen==0 || blen==0) {
	        return "";
	      }
	      else
	      {
	    	  String aLast = a.get(alen-1);
		      String bLast = b.get(blen-1);
		      
		      if(aLast.contains(":"))
		      {
		    	  String[] parts = aLast.split(":");
		    	  aLast = parts[0];
		      }
		      
		      if(bLast.contains(":"))
		      {
		    	  String[] parts = bLast.split(":");
		    	  bLast = parts[0];
		      }
		      
	    	  if (aLast.equals(bLast))
	    	  {
		    	  String subResult = lcs(a.subList(0, alen-1), b.subList(0, blen-1));
		    	  if(subResult.equals(""))
		    		  return lcs(a.subList(0, alen-1), b.subList(0, blen-1))+aLast;
		    	  else
		    		  return lcs(a.subList(0, alen-1), b.subList(0, blen-1))+","+aLast;
	    	  }
	    	  else {
		        x=lcs(a,b.subList(0,blen-1));
		        y=lcs(a.subList(0,alen-1),b);
	    	  }
	      }	  
	      return (x.length()>y.length()) ? x : y;
   }
   
   public static List<Node> returnAllNodes(Node node)
   {
	   List<Node> listOfNodes = new ArrayList<Node>();
	   addAllNodes(node, listOfNodes);
	   return listOfNodes;
   }
	
	private static void addAllNodes(Node node, List<Node> listOfNodes) 
	{
	    if (node != null) 
	    {
	        listOfNodes.add(node);
	        log(node.label);
	        List<Node> children = node.children;
	        if (children != null) 
	        {
	            for (Node child: children) 
	            {
	                addAllNodes(child, listOfNodes);
	            }
	        }
	    }
	}
   
    private String getCharForNumber(int i) 
    {
	    return i >= 0 && i < 27 ? String.valueOf((char)(i + 'A')) : (getCharForNumber(i/26)+getCharForNumber(i%26));
	}
    
	private static void log(String msg)
	{
		System.out.println(msg);
	}
	
	private void textFieldErrorTest(int limit, JTextField errorField)
    {
    	try{
    		Integer int1 = Integer.parseInt(errorField.getText());   
            if(int1 > limit)
               	exceedsLimit(limit,errorField);	
           }catch (Exception z){ incorrectDatatype(errorField);  }  
    }
    
    private void incorrectDatatype(JTextField errorField)
    {
    	JOptionPane.showMessageDialog(this, "Incorrect Data Type! Numbers Only!", "Inane error", JOptionPane.ERROR_MESSAGE);  
        errorField.setText("");  
        errorField.requestFocusInWindow();
        return;  
    }	
    
    private void exceedsLimit(int limit, JTextField errorField)
    {
    	JOptionPane.showMessageDialog(this, "Limit "+limit+" Exceeded!", "Inane error", JOptionPane.ERROR_MESSAGE);
    	errorField.setText("");  
        errorField.requestFocusInWindow();
        return;
    }	
}


/*log(path.toString()+"   "+subList.toString());
		   //if(path.contains(subList))
		   if(path.toString().contains(subList.toString()))
			   log("Yes");
		   else
			   log("No");
 * 
 * 
 * Map<String,Integer> items = new LinkedHashMap<String, Integer>();
for (List<String> path : paths) 
{
	   String[] parts = path.get(path.size()-1).split(":");
	   if(items.containsKey(parts[0]))
	   {
		   int value = items.get(parts[0]);
		   value = value + Integer.parseInt(parts[1]);
		   items.put(parts[0], value);
	   }
	   else
		   items.put(parts[0], Integer.parseInt(parts[1]));
	   
	   for(int i=0;i<path.size()-1;i++)
	   {
		   if(items.containsKey(path.get(i)))
		   {
			   int value = items.get(path.get(i));
			   value = value + Integer.parseInt(parts[1]);
			   items.put(path.get(i), value);
		   }
		   else
		   {
			   items.put(path.get(i),Integer.parseInt(parts[1]));
		   }
	   }
}*/
