from os import access
import jwt.utils
import time
import math
import requests

#DO NOT COMMIT ACCESS KEYS.
accessKey = ["DEV_ID","KEY_ID","SECURITY_CODE"]

token = jwt.encode(
    {
        "aud": "doordash",
        "iss": accessKey[0],
        "kid": accessKey[1],
        "exp": str(math.floor(time.time() + 300)),
        "iat": str(math.floor(time.time())),
    },
    jwt.utils.base64url_decode(accessKey[2]),
    algorithm="HS256",
    headers={"dd-ver": "DD-JWT-V1"})

endpoint = "https://openapi.doordash.com/drive/v2/deliveries/"

headers = {"Accept-Encoding": "application/json",
           "Authorization": "Bearer " + token,
           "Content-Type": "application/json"}

request_body = { # Modify pickup and drop off addresses below
    "external_delivery_id": "D-00001",
    "pickup_address": "901 Market Street 6th Floor San Francisco, CA 94103",
    "pickup_business_name": "Wells Fargo SF Downtown",
    "pickup_phone_number": "+16505555555",
    "pickup_instructions": "Enter gate code 1234 on the callbox.",
    "dropoff_address": "901 Market Street 6th Floor San Francisco, CA 94103",
    "dropoff_business_name": "Wells Fargo SF Downtown",
    "dropoff_phone_number": "+16505555555",
    "dropoff_instructions": "Enter gate code 1234 on the callbox.",
    "order_value": 1999,
    "tip": 599,
    "items":[
        {
            "name": "Chicken Burrito",
            "quantity": 2,
            "description": "A tasty oversized burrito with chicken, rice, beans, and cheese.",
            "external_id": "418575",
        }
    ]
}

create_delivery = requests.post(endpoint, headers=headers, json=request_body) # Create POST request

print(token)

print(create_delivery.status_code)
print(create_delivery.text)
print(create_delivery.reason)