USERS = [
    {
        "first_name": "Alice",
        "last_name": "Smith",
        "username": "alice",
        "email": "alice@test.com",
    },
    {
        "first_name": "Bob",
        "last_name": "Jones",
        "username": "bob",
        "email": "bob@test.com",
    },
]


USER_GROUPS = [
    {"case": "single_user", "users": [USERS[0]]},
    {"case": "multiple_users", "users": USERS},
]
