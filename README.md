# About Noms
For this project, I created a MERN (MongoDB, Express, React, Nodejs) stack app called Noms. It lets the user to rate, NOT the restuarant, but the individual dish at the restuarant so that it will help users to pick the best dish at the restuarant. Once the user signs in, the user can upload a picture and rate the dish (up to five stars). The user has an access to other users' ratings, but does not have any access to edit or delete other users' reviews. The user can update or delete their own review.

- <a href=https://github.com/sookim-Boston/noms-backend>Repo for Noms' Express API</a>
- <a href=https://github.com/sookim914/noms>Repo for Noms' frontend </a>
- <a href=https://fast-peak-68836.herokuapp.com/>Deployed backend Heroku</a>
- <a href=https://sookim914.github.io/noms/>Noms</a>

### Technologies used
- MongoDB
- mongoose
- express
- AWS

### Routes

`user routes`
- `/sign-up`: POST for sign up credentials
- `/sign-in`: POST for sign in credentials
- `/change-password`: PATCH for updating credentials
- `/sign-out`: DELETE for sign out


`review routes`
-`/items/:id`: GET for index of reviews for the dish(item)
-`/items/:id/reviews/`: POST for creating the review
-`/items/:id/reviews/:rid`: PATCH for updating the review (requires ownership)
-`/items/:id/reviews/:rid`: DELETE for deleting the review

### Set up and installation
1. npm install to install dependencies
2. create a balnk heroku app by running `heroku create`
3. set client origin using github username
4. run `git push heroku master` to push the code to Heroku
5. create s3 bucket in AWS
6. retrieve AWS access key and save them in Heroku


### Development Process
1. Created a wirefram, ERD, and user stories to set up goals for the project
2. Created models based from ERD
3. Created routes
4. API events
    - show reviews: GET request
    - create review: POST request
    - update review: PATCH request
    - destory review: DELETE request


### Challenges & Problem-Solving
-  Updating file (AWS): the user can delete their review on the same page, where they see all the reviews. Once the user deletes the review, the browser needs to be "refreshed" so that it will get the user updated browser with their review deleted. In order to do that, I used dummy route '/reload' before redirecting the browser back to the review page so that it reflects updated browser for the user
- File update: Whenever the user update the review with new file (picture), my backend finds the review in my s3 bucket and deletes the file, uploads the new file, and update the review with newly uploaded file
- Deleting the review: Since item(meal) has many reviews, whenever the user creates the review, it gets pushed to item's `reviews` array. Therefore, whenever the user deletes the individual review, the backend finds the item by its id. Then it finds the review in that item's `reviews` array by review's id and deletes that review from the array.



### Unsolved Problems
Things that I am planning to work on:
Using extenal API to get restuarant/menu data so that the user can search the restuarant and add reviews using the menu data


### Wireframes and User stories
As a user, I should be able to sign up
As a user, I should be able to sign in
As a user, I should be able to sign out
As a user, I should be able to change my PW
As a user, I should be able to create a review
As a user, I should be able to update my review
As a user, I should be able to see other users' reviews
As a user, I should be able to delete my review

### Entity Relationship Diagram (ERD)

<img src=https://i.imgur.com/fTg1zXC.jpg>

### Wireframes

<img src=https://i.imgur.com/D7i26Bn.jpg>
