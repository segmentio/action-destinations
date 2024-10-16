import pandas as pd

# Load the CSV files
file1 = 'Documents/Google Conversion IDs Sept 2024.csv'
file2 = 'Downloads/Rajul Query.csv'

# Read the CSV files into DataFrames
df1 = pd.read_csv(file1)
df2 = pd.read_csv(file2)

# Combine the DataFrames based on a common column (e.g., 'id')
# You can use 'inner', 'outer', 'left', or 'right' joins based on your needs
combined_df = pd.merge(df1, df2, on='SOURCE_ID', how='inner')

# Save the combined DataFrame to a new CSV file
combined_df.to_csv('combined_file.csv', index=False)

print("Files combined successfully!")
