from utils import greet, factorial

print(greet("World"))
for i in range(1, 6):
    print(f"{i}! = {factorial(i)}")
for i in range(5):
    print(f"Loop iteration: {i}")
