package com.securewealth.repository;

import com.securewealth.model.BehaviorProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BehaviorProfileRepository extends JpaRepository<BehaviorProfile, Long> {
    Optional<BehaviorProfile> findByUserId(Long userId);
}
