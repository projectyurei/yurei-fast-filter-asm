# Solana SDK and toolchain paths
SOLANA_SDK := $(HOME)/.cache/solana/v1.52/platform-tools
LLVM_DIR := $(HOME)/.cache/solana/v1.52/platform-tools/llvm
CLANG := $(LLVM_DIR)/bin/clang
LD := $(LLVM_DIR)/bin/ld.lld

# Set src/out directory and compiler flags
SRC := src/filter
OUT := dist
DEPLOY := dist
ARCH := -target sbf -march=bpfel+solana
LDFLAGS := -shared -z notext --image-base 0x100000000

# Define the target
TARGET := $(DEPLOY)/filter.so

# Default target
all: $(TARGET)

build: all

# Build shared object
$(TARGET): $(OUT)/filter.o ${SRC}/filter.ld
	@mkdir -p $(DEPLOY)
	$(LD) $(LDFLAGS) -T ${SRC}/filter.ld -o $@ $<

# Compile assembly
$(OUT)/filter.o: ${SRC}/filter.s
	@mkdir -p $(OUT)
	$(CLANG) -Os $(ARCH) -c -o $@ $<

# Prepare for deploy
deploy:
	@if [ ! -f $(DEPLOY)/filter-keypair.json ]; then \
		echo "filter-keypair.json does not exist. Creating..."; \
		solana-keygen new --no-bip39-passphrase --outfile $(DEPLOY)/filter-keypair.json; \
	fi
	solana program deploy $(TARGET) --program-id $(DEPLOY)/filter-keypair.json --keypair payer.json -u localhost

# Cleanup
.PHONY: clean
clean:
	rm -rf $(OUT) $(DEPLOY)/filter.so
