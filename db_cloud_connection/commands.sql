-- <<CREATE COMMANDS>>

-- Table for storing customer account information

CREATE TABLE Customer (

    CustomerID INT PRIMARY KEY,

    DateOfBirth DATE,

    Username VARCHAR(255),

    Email VARCHAR(255),

    Password VARCHAR(255)

);



-- Table for storing user subscriptions to various apps

CREATE TABLE Subscription (

    SubscriptionID INT PRIMARY KEY,        

    CustomerID INT,

    App VARCHAR(255),

    ExpirationDate DATETIME,

    TypeLevel VARCHAR(255),

    FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID)

);



-- Table for storing orders placed by customers

CREATE TABLE Orders (

    OrderID INT PRIMARY KEY,

    CustomerID INT,

    RestaurantID INT,                      

    PriceTotal DECIMAL(10, 2),

    Additional_Costs DECIMAL(10, 2),

    FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID),

    FOREIGN KEY (RestaurantID) REFERENCES Restaurant(RestaurantID)

);



-- Associate Entity -> Table To Handle Orders and Foods

CREATE TABLE FoodOrders (

    OrderID INT,

    FoodID INT,

    Quantity INT,

    FOREIGN KEY (OrderID) REFERENCES Orders(OrderID),

    FOREIGN KEY (FoodID) REFERENCES Food(FoodID),

    PRIMARY KEY (OrderID, FoodID)

);



-- Table for storing reviews from customers about restaurants

CREATE TABLE Review (

    ReviewID INT PRIMARY KEY,        

    Date DATETIME,                          

    RestaurantID INT,                    

    CustomerID INT,                      

    Rating DECIMAL(3, 2),                  

    ReviewContent TEXT,                

    FOREIGN KEY (RestaurantID) REFERENCES Restaurant(RestaurantID),

    FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID)

);



-- Table for storing foods from different restaurants

CREATE TABLE Food (

    FoodID INT PRIMARY KEY,                

    FoodName VARCHAR(255),                  

    Price DECIMAL(10, 2),                            

    RestaurantID INT,                        

    FOREIGN KEY (RestaurantID) REFERENCES Restaurant(RestaurantID)

);



-- Table for storing messages between users

CREATE TABLE Messages (

    MessageID INT PRIMARY KEY,

    SenderID INT,  

    RecipientID INT,

    Datetime DATETIME,  

    Content TEXT,  

    FOREIGN KEY (SenderID) REFERENCES Customer(CustomerID),

    FOREIGN KEY (RecipientID) REFERENCES Customer(CustomerID)

);



-- Table for storing customer addresses

CREATE TABLE Customer_Address (

    CustomerID INT,  

    Address VARCHAR(255),  

    PRIMARY KEY (CustomerID, Address),  

    FOREIGN KEY (CustomerID) REFERENCES Customer(CustomerID)

);



-- Table for storing photos of foods

CREATE TABLE Photo (

    PhotoID INT PRIMARY KEY,  

    PhotoImage VARCHAR(255),            

    FoodID INT,                            

    FOREIGN KEY (FoodID) REFERENCES Food(FoodID)

);



-- Table for storing which restaurants are featured on the front page

CREATE TABLE Front_Page (

    RestaurantID INT,                      

    Date DATE,                    

    PushPoints INT,                        

    PRIMARY KEY (RestaurantID, Date),

    FOREIGN KEY (RestaurantID) REFERENCES Restaurant(RestaurantID)

);



-- Table for storing restaurant account information

CREATE TABLE Restaurant_Account (

    AccountID INT PRIMARY KEY,

    Username VARCHAR(255),      

    Password VARCHAR(255),    

    Email VARCHAR(255),  

    

);



CREATE TABLE Restaurant (

    RestaurantID PRIMARY KEY,

    RestaurantName VARCHAR(40),

    Category VARCHAR(255),

    Rating DECIMAL(3,2),

    PhoneNumber VARCHAR(15),

    AccountID INT,                

    Address VARCHAR(255)

    FOREIGN KEY (AccountID) REFERENCES Restaurant_Account(AccountID)

);


SELECT Statements

-- <<SELECT COMMANDS>>

-- Customer Login – Validate user credentials

SELECT CustomerID, Username, Email

FROM Customer

WHERE Username = 'input_username'

  AND Password = 'input_password';



-- Check for Existing Customer (Registration)

SELECT CustomerID

FROM Customer

WHERE Username = 'input_username'

   OR Email = 'input_email';



-- Restaurant Login – Validate restaurant account credentials

SELECT AccountID, RestaurantID, Username, Email

FROM Restaurant_Account

WHERE Username = 'input_restaurant_username'

  AND Password = 'input_restaurant_password';



-- Retrieve Customer Profile Information

SELECT CustomerID, DateOfBirth, Username, Email

FROM Customer

WHERE CustomerID = ?;



-- List Customer Addresses

SELECT Address

FROM Customer_Address

WHERE CustomerID = ?;



-- Retrieve Messages (Inbox and Sent)

SELECT MessageID, SenderID, RecipientID, Datetime, Content

FROM Messages

WHERE SenderID = ? OR RecipientID = ?

ORDER BY Datetime DESC;



-- Get Customer Orders with Details

SELECT Orders.OrderID, Orders.PriceTotal, Restaurant.RestaurantID, Food.FoodName, Food.Price

FROM Orders, Restaurant, Food

WHERE (Orders.FoodID = Food.FoodID)

AND (Orders.RestaurantID - Restaurant.RestaurantID)

WHERE Orders.CustomerID = ?;



-- Retrieve All Restaurants (Optionally Filter by Area)

SELECT RestaurantID, Category, Rating, PhoneNumber, Address

FROM Restaurant

WHERE Address LIKE '%input_area%';



-- Retrieve Restaurants Reviewed by the Customer

SELECT DISTINCT r.RestaurantID, r.Category, r.Rating, r.PhoneNumber, r.Address

FROM Restaurant r

JOIN Review rev ON r.RestaurantID = rev.RestaurantID

WHERE rev.CustomerID = ?;



-- Retrieve Restaurants Reviewed by the Customer

SELECT DISTINCT r.RestaurantID, r.Category, r.Rating, r.PhoneNumber, r.Address

FROM Restaurant r

JOIN Review rev ON r.RestaurantID = rev.RestaurantID

WHERE rev.CustomerID = ?;



-- Most Reviewed Restaurants

SELECT RestaurantID, COUNT(Review.ReviewID) AS review_count

FROM Restaurant, Review

WHERE (Restaurant.RestaurantID = Review.RestaurantID)

GROUP BY Restaurant.RestaurantID

ORDER BY review_count DESC;



-- Featured Restaurants (from Front_Page Table)

SELECT Front_Page.RestaurantID, Front_Page.Date, Front_Page.PushPoints, Restaurant.Category, Restaurant.Rating

FROM Front_Page, Restaurant

WHERE (Restaurant.RestaurantID = Front_Page.RestaurantID)

ORDER BY Front_Page.Date DESC, Front_Page.PushPoints DESC;



-- Customer Leaderboard Based on Review Activity

SELECT c.CustomerID, c.Username, COUNT(rev.ReviewID) AS total_reviews

FROM Customer c

LEFT JOIN Review rev ON c.CustomerID = rev.CustomerID

GROUP BY c.CustomerID

ORDER BY total_reviews DESC;



-- Display Reviews for a Specific Restaurant

SELECT Review.ReviewID, Review.Date, Review.Rating, Review.ReviewContent, Customer.Username

FROM Review, Customer

WHERE (Review.CustomerID = Customer.CustomerID)

AND Review.RestaurantID = ?

ORDER BY Review.Date DESC;



-- Retrieve Restaurant Details

SELECT RestaurantID, Category, Rating, PhoneNumber, Address

FROM Restaurant

WHERE RestaurantID = ?;



-- List Menu Items for a Restaurant

SELECT FoodID, FoodName, Price

FROM Food

WHERE RestaurantID = ?;



-- Calculate the Average Rating for a Restaurant

SELECT AVG(Rating) AS average_rating

FROM Review

WHERE RestaurantID = ?;



-- Retrieve Photos for a Food Item

SELECT PhotoID, PhotoImage

FROM Photo

WHERE FoodID = ?;







-- <<UPDATE COMMANDS>>

-- Update Customer Profile Info

UPDATE Customer

SET DateOfBirth = 'YYYY-MM-DD',

    Username = 'new_username',

    Email = 'new_email'

WHERE CustomerID = ?;



-- Update Restaurant Account Details

UPDATE Restaurant_Account

SET Username = 'new_restaurant_username',

    Email = 'new_email'

WHERE AccountID = ?;



-- Update Subscription Details

UPDATE Subscription

SET ExpirationDate = 'YYYY-MM-DD HH:MM:SS',

    TypeLevel = 'new_type'

WHERE SubscriptionID = ?;



-- Update Customer Address

UPDATE Customer_Address

SET Address = 'new_address'

WHERE CustomerID = ? AND Address = 'old_address';



-- Update a Customer Review

UPDATE Review

SET Rating = ?,

    ReviewContent = 'Updated review content'

WHERE ReviewID = ?;



-- Update Food Menu Item

UPDATE Food

SET FoodName = 'new_food_name',

    Price = new_price

WHERE FoodID = ?;



-- Update Message Content

UPDATE Messages

SET Content = 'Updated message content'

WHERE MessageID = ? AND SenderID = ?;



-- Update Front Page Push Points

UPDATE Front_Page

SET PushPoints = new_value

WHERE RestaurantID = ? AND Date = 'YYYY-MM-DD';



-- Update Restaurant Details

UPDATE Restaurant

SET Category = 'new_category',

    Rating = new_rating,

    PhoneNumber = 'new_phone',

    Address = 'new_address'

WHERE RestaurantID = ?;



-- <<DELETE COMMANDS>>

-- Delete a Customer Account

DELETE FROM Customer

WHERE CustomerID = ?;



-- Delete a Customer Address

DELETE FROM Customer_Address

WHERE CustomerID = ? AND Address = 'address_to_remove';



-- Delete a Subscription

DELETE FROM Subscription

WHERE SubscriptionID = ?;



-- Delete a Customer Review

DELETE FROM Review

WHERE ReviewID = ?;



-- Delete an Order

DELETE FROM Orders

WHERE OrderID = ?;



-- Delete a Message

DELETE FROM Messages

WHERE MessageID = ?;



-- Delete a Photo

DELETE FROM Photo

WHERE PhotoID = ?;



-- Delete a Restaurant Account

DELETE FROM Restaurant_Account

WHERE AccountID = ?;



-- Delete a Restaurant Entry

DELETE FROM Restaurant

WHERE RestaurantID = ?;



-- Delete a Front Page Entry

DELETE FROM Front_Page

WHERE RestaurantID = ? AND Date = 'YYYY-MM-DD';


INSERT Statements:

INSERT INTO Customer

    VALUES

        (1,'2001-01-01','user1','u1@gmail.com','pass1'),

        (2,'2002-02-02','user2','u2@gmail.com','pass2'),

        (3,'2003-03-03','user3','u3@gmail.com','pass3'),

        (4,'2004-04-04','user4','u4@gmail.com','pass4'),

        (5,'2005-05-05','user5','u5@gmail.com','pass5'),

        (6,'2006-06-06','user6','u6@gmail.com','pass6'),

        (7,'2007-07-07','user7','u7@gmail.com','pass7'),

        (8,'2008-08-08','user8','u8@gmail.com','pass8'),

        (9,'2009-09-09','user9','u9@gmail.com','pass9'),

        (10,'2010-10-10','user10','u10@gmail.com','pass10');



INSERT INTO Customer_Address

    VALUES

        (1,'1 Residence Drive'),

        (2,'2 Living Street'),

        (3,'3 Homestead Avenue'),

        (4,'2 Residence Drive'),

        (5,'5 Coresidence Drive'),

        (6,'5 Coresidence Drive'),

        (7,'6 Residence Drive'),

        (8,'7 E11th Street'),

        (9,'8 Residence Drive'),

        (10,'10 Residence Drive');



INSERT INTO Food

    VALUES

        (1,'French Toast',10.99,10),

        (2,'Fried Rice',7.99,1),

        (3,'Soup Noodles',12.99,1),

        (4,'Pasta with Meatballs',14.99,4),

        (5,'Super Spicy Burrito',13.99,3),

        (6,'Orange Chicken',15.99,6),

        (7,'Miso Noodles',12.99,5),

        (8,'Fish',10.99,7),

        (9,'Soft Serve Cone',4.99,8),

        (10,'Escargots',20.99,9);



INSERT INTO Front_Page

    VALUES

        (1,'2021-01-01',52),

        (1,'2022-01-01',48),

        (2,'2020-01-01',192),

        (3,'1999-04-02',123),

        (4,'2001-01-03',12),

        (5,'2017-07-26',188),

        (6,'2009-01-01',27),

        (8,'2024-01-01',18),

        (9,'2025-01-01',65),

        (10,'2025-03-14',2092);



INSERT INTO Messages

    VALUES

        (1,1,2,'2021-01-25','I like to creep around my house and act liek a goblin.'),

        (2,6,3,'2007-10-15','The quick brown fox jumps over the lazy red dog.'),

        (3,8,2,'2002-04-07','I think you need psychiatric help.'),

        (4,4,5,'1992-02-12','Who are you I am Frank Henry'),

        (5,10,4,'2005-05-21','POLICE! HANDS UP!'),

        (6,2,1,'2025-02-27','Dont forget to come to work at 12:00 AM this morning!'),

        (7,8,9,'2023-01-31','Dude youre not gonna believe what 7 said he was gonna do'),

        (8,7,8,'2023-01-30','im gonna eat 9'),

        (9,4,8,'2005-05-23','Im suing you'),

        (10,3,10,'2001-04-22','dude I think you ate too much donuts');



INSERT INTO Orders

    VALUES

        (1,3,10,10.99,1),

        (2,6,1,7.99,2),

        (3,4,1,12.99,3),

        (4,4,4,14.99,4),

        (5,9,3,13.99,5),

        (6,10,9,18.99,10),

        (7,1,8,4.99,9),

        (8,6,6,7.99,6),

        (9,2,4,14.99,4),

        (10,10,7,5.99,8);



INSERT INTO Photo

    VALUES

        (1,2,'img.jpg'),

        (2,8,'awful_fish.png'),

        (3,7,'soup.jpg'),

        (4,5,'spicy.png'),

        (5,2,'good_rice.jpg'),

        (6,3,'img.png'),

        (7,6,'chicken.png'),

        (8,1,'bakery.jpg'),

        (9,9,'cone.jpg'),

        (10,10,'snails.png');



INSERT INTO Restaurant

    VALUES

    (1,'Chinese',5.00,9789789788,'1 Food Street','Super Wok'),

    (2,'American',4.80,9782223333,'2 Food Street','Bob Burger'),

    (3,'Mexican',3.90,9783332222,'3 Food Street','Burrito Royale'),

    (4,'Italian',4.20,9784444444,'4 Food Street','Little Italy'),

    (5,'Japanese',3.60,9786453122,'5 Food Street','Senshi Sushi'),

    (6,'Chinese',4.50,9786546321,'6 Food Street','Jade Tiger'),

    (7,'Variety',2.80,9781245122,'42 Cafeteria Avenue','Loptin Hall'),

    (8,'Dessert',4.05,9124568888,'7 Food Street','Pineros Desserts'),

    (9,'French',5.00,2319998765,'12 Cuisine Street','Le Etranger'),

    (10,'Bakery',4.89,4511251010,'10 collapse Avenue','Code Name Bakery');



INSERT INTO Restaurant_Account

    VALUES

    (1,1,'Super Wok','superwok1','swok@swok.com'),

    (2,2,'Bob Burger','bobburger2','bburg@bburg.com'),

    (3,3,'Burrito Royale','burritoroyale3','broyal@broyale.com'),

    (4,4,'Little Italy','littleitaly4',''),

    (5,5,'Senshi Sushi','senshisushi5',''),

    (6,6,'Jade Tiger','jadetiger6',''),

    (7,8,'Pineros Desserts','pinerosdesserts7',''),

    (8,7,'Loptin Hall','unyeats8',''),

    (9,9,'Le Etranger','leetranger9',''),

    (10,10,'Code Name Bakery','codenamebakery10','');



INSERT INTO Review

    VALUES

    (1,'2020-12-04',5,2,5.00,'It was really good'),

    (2,'1999-06-12',9,10,4.80,'Decent food but a little pricy'),

    (3,'2001-03-24',1,2,5.00,'the atmosphere threw me off but it was the best'),

    (4,'2012-04-20',8,5,4.50,'they were good if a little anomalous'),

    (5,'2023-02-10',6,3,3.70,'pricey and expensive'),

    (6,'2019-07-03',10,10,5.00,'cant beat this bread'),

    (7,'1999-03-30',3,4,4.20,'burned my tounge off but it was worth it'),

    (8,'2002-04-27',7,7,3.00,'food varies between ok and straight up terrible'),

    (9,'2014-08-07',2,5,4.00,'solid burger'),

    (10,'2000-06-21',3,4,4.50,'solid food');



INSERT INTO Subscription

    VALUES

    (1,1,'Grubhub','2028-01-01','Basic'),

    (2,2,'Grubhub','2025-01-01','Premium'),

    (3,2,'MealPlan','2028-06-01','Basic225'),

    (4,10,'Grubhub','2023-12-31','Premium'),

    (5,6,'UberEats','2025-10-22','Tier 1'),

    (6,4,'UberEats','2030-01-01','Tier 2'),

    (7,3,'MealPlan','2030-06-01','Advanced225'),

    (8,7,'Grubhub','2032-01-01','Basic'),

    (9,8,'UberEats','2027-01-01','Tier 2'),

    (10,5,'Belli','2040-01-01','Lifetime');


ALTER TABLE Restaurant

ADD COLUMN push_points INT DEFAULT 0;


DELIMITER $$

CREATE OR REPLACE TRIGGER clear_account

AFTER DELETE ON Restaurant

FOR EACH ROW

BEGIN

	DELETE FROM Restaurant_Account WHERE RestaurantID NOT IN(SELECT RestaurantID FROM Restaurant);

END$$

DELIMITER;


DELIMITER $$

CREATE OR REPLACE TRIGGER clear_foods

AFTER DELETE ON Restaurant

FOR EACH ROW

BEGIN

	DELETE FROM Food WHERE RestaurantID NOT IN(SELECT RestaurantID FROM Restaurant);

END$$

DELIMITER ;


DELIMITER $$

CREATE OR REPLACE FUNCTION get_top_page() RETURNS INT

BEGIN

	DECLARE most_points INT;

	SET most_points = SELECT RestaurantID, MAX(push_points) FROM Front_Page;

    	RETURN most_points;

END$$


