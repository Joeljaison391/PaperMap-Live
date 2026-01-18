use sha2::{Digest, Sha256};
use std::fs::File;
use std::io;
use std::path::Path;

pub fn validate_file(path: &Path, expected_hash: &str) -> bool {
    match hash_file(path) {
        Ok(hash) => hash == expected_hash,
        Err(_) => false,
    }
}

pub fn hash_file(path: &Path) -> Result<String, io::Error> {
    let mut file = File::open(path)?;
    let mut hasher = Sha256::new();
    io::copy(&mut file, &mut hasher)?;
    Ok(format!("{:x}", hasher.finalize()))
}
