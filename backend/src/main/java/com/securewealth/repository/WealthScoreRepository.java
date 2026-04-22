package com.securewealth.repository;

import com.securewealth.model.WealthScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WealthScoreRepository extends JpaRepository<WealthScore, Long> {
    Optional<WealthScore> findByUserId(Long userId);
}
