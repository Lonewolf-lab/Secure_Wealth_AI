package com.securewealth.util;

import lombok.experimental.UtilityClass;

@UtilityClass
public class WPRSCalculator {

    public static int calculate(boolean isNewDevice, boolean isVelocityFast,
                                boolean isAmountAnomaly, boolean isFirstTimeAction,
                                int otpRetryCount, int cancelRetryCount) {
        int score = 0;

        if (isNewDevice) score += 30;
        if (isVelocityFast) score += 20;
        if (isAmountAnomaly) score += 40;
        if (isFirstTimeAction) score += 15;
        if (otpRetryCount > 2) score += 20;
        if (cancelRetryCount > 1) score += 10;

        return Math.min(score, 100);
    }
}
