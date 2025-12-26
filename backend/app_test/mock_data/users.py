USERS = [
    {
        "first_name": "Alice",
        "last_name": "Smith",
        "username": "alice",
        "email": "alice@test.com",
        "fb_id": "1234",
    },
    {
        "first_name": "Bob",
        "last_name": "Jones",
        "username": "bob",
        "email": "bob@test.com",
        "fb_id": "5678",
    },
]


USER_GROUPS = [
    {"case": "single_user", "users": [USERS[0]]},
    {"case": "multiple_users", "users": USERS},
]
