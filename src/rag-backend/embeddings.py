# from langchain_huggingface import HuggingFaceEmbeddings

# EMBED = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")


from langchain_huggingface import HuggingFaceEmbeddings

EMBED = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

print("Testing embedding model...")

test_embedding = EMBED.embed_query("hello world")

print("Embedding length:", len(test_embedding))
print("First 5 values:", test_embedding[:5])