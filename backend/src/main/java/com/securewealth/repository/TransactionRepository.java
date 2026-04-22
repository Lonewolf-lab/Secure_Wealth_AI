package com.securewealth.repository;

import com.securewealth.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByUserIdOrderByTimestampDesc(Long userId);
    List<Transaction> findByUserIdAndTimestampAfter(Long userId, LocalDateTime timestamp);
}
