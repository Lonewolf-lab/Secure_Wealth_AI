package com.securewealth.service;

import com.securewealth.dto.request.CreateGoalRequest;
import com.securewealth.model.Goal;
import com.securewealth.model.User;
import com.securewealth.model.enums.GoalCategory;
import com.securewealth.repository.GoalRepository;
import com.securewealth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class GoalService {

    private final GoalRepository goalRepository;
    private final UserRepository userRepository;

    public List<Goal> getGoals(Long userId) {
        return goalRepository.findByUserId(userId);
    }

    @Transactional
    public Goal createGoal(Long userId, CreateGoalRequest request) {
        User user = userRepository.findById(userId).orElseThrow();

        Goal goal = Goal.builder()
                .user(user)
                .name(request.getName())
                .targetAmount(request.getTargetAmount())
                .currentSaved(request.getCurrentSaved())
                .deadline(request.getDeadline())
                .category(GoalCategory.valueOf(request.getCategory().toUpperCase()))
                .createdAt(LocalDateTime.now())
                .build();

        return goalRepository.save(goal);
    }
}
