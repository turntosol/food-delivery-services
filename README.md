# FoodTime – Food Delivery Services

## Introduce

FoodTime is a web-based food delivery system developed to provide users with a convenient way to browse, search, and order food online.

The system allows users to manage their shopping cart, place orders, view bills, manage their wallet, receive notifications, contact FoodTime, and manage their personal account.

FoodTime also provides an Admin Dashboard powered by Django Admin, allowing authorized administrators to manage application data through a web-based administration interface.

## Demo
https://food-delivery-services.onrender.com

## Features
* **Authentication:** Sign up, login, and logout account.
* **Food:** Browse foods by category, search by name/category, and view food details.
* **Cart & Order:** Add, update, and remove food items from the cart, checkout, and place orders.
* **Bill:** View bills and search/filter bills by Order ID and date.
* **Wallet:** View balance, add money, and view transaction history.
* **Notification:** Receive order and wallet notifications and manage notification settings.
* **Contact:** View FoodTime contact information and send messages.
* **Account:** Update profile, manage delivery addresses, change password, manage notifications, and logout.
* **Admin Dashboard:** Access the Django administration panel to manage registered application data, depending on the administrator's permissions and the models registered in Django Admin.

## Technologies

### Frontend
* HTML5
* CSS3
* JavaScript

### Backend
* Python
* Django
* Django REST Framework

### Database
* PostgreSQL
* Supabase

### Deployment
* Render

## Setup

### Frontend

Navigate to the frontend directory:

```bash
cd frontend
```

Open `index.html` using a local development server such as **VS Code Live Server**.

The frontend will then be available at the local URL provided by the development server.

### Backend

Navigate to the backend directory:

```bash
cd backend
```

Create and activate a virtual environment:

```bash
python -m venv venv
```

**Windows:**

```bash
venv\Scripts\activate
```

Install the required dependencies:

```bash
pip install -r requirements.txt
```

Configure the Supabase PostgreSQL database connection in Django `settings.py`.

Run database migrations:

```bash
python manage.py migrate
```

Create an administrator account:

```bash
python manage.py createsuperuser
```

Start the Django development server:

```bash
python manage.py runserver
```

The backend API will be available at:

```bash
http://127.0.0.1:8000/
```

After starting the backend, open the following URL in your browser:

```bash
http://127.0.0.1:8000/admin/
```
