package com.securewealth.repository;

import com.securewealth.model.Investment;
import com.securewealth.model.enums.InvestmentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvestmentRepository extends JpaRepository<Investment, Long> {
    List<Investment> findByUserId(Long userId);
    List<Investment> findByUserIdAndType(Long userId, InvestmentType type);
}
