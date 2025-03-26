# Python program to Count Inversions in an array 
# using nested loop

# Function to count inversions in the array
def inversionCount(arr):
    n = len(arr) 
    invCount = 0  

    for i in range(n - 1):
        for j in range(i + 1, n):
          
            # If the current element is greater than the next,
            # increment the count
            if arr[i] > arr[j]:
                invCount += 1
    return invCount  

if __name__ == "__main__":
    arr = [45, 72, 18, 90, 33, 56, 81, 24, 67, 41, 92, 40]
    print(inversionCount(arr))

# i                         k
# [18, 33, 45, 56, 72, 90], [24, 40, 41, 67, 81, 92]

# [18, 24, 33, 40, 41, 56, 67, 72, 81, 90, 92]
# 33 > 24 k = 0
# 45 > 24, 40, 41
# 56 > 24, 40, 41
# 72 > 24, 40, 41, 67
# 90 > 24, 40, 41, 67, 81
# every time i gets incremented, add k
# 5 + 4 + 3 + 3 + 1 = 16
# terminate traversal when i and k both reach the length 
# of the array they traverse
# if k reaches the end before i does then we would add k + 1
# because k + 1 at the end is just length of the array
# and any new i would exceed them.