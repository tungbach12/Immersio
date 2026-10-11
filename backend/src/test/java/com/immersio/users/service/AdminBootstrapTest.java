package com.immersio.users.service;

import com.immersio.users.domain.User;
import com.immersio.users.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Guards the admin bootstrap. On an existing production database the very first
 * registered user was created before this rule existed, so `count() == 0` never
 * fires again and the install is left with no account that can reach /admin.
 */
class AdminBootstrapTest {

    private final UserRepository userRepository = mock(UserRepository.class);

    @Test
    void promotesTheVeryFirstUserOnAFreshInstall() {
        when(userRepository.count()).thenReturn(0L);
        User user = mock(User.class);

        AdminService.bootstrapAdminRole(userRepository, user);

        verify(user).setRole("Admin");
    }

    @Test
    void doesNotPromoteAnOrdinarySignupOnAnExistingInstall() {
        when(userRepository.count()).thenReturn(5L);
        User user = mock(User.class);

        AdminService.bootstrapAdminRole(userRepository, user);

        // ADMIN_EMAIL is unset in the test env, so nobody is promoted.
        verify(user, never()).setRole(anyString());
    }

    @Test
    void promotesTheConfiguredAdminEmailWhenTheInstallHasNoAdmin() {
        when(userRepository.count()).thenReturn(5L);
        when(userRepository.countByRoleAndEmailIgnoreCase(anyString(), anyString())).thenReturn(0L);
        User user = mock(User.class);

        AdminService.bootstrapAdminRole(userRepository, user, "owner@immersio.me");

        verify(user).setRole("Admin");
    }

    @Test
    void leavesTheRoleAloneWhenAnAdminAlreadyExists() {
        when(userRepository.count()).thenReturn(5L);
        when(userRepository.countByRoleAndEmailIgnoreCase(anyString(), anyString())).thenReturn(1L);
        User user = mock(User.class);

        AdminService.bootstrapAdminRole(userRepository, user, "owner@immersio.me");

        verify(user, never()).setRole(anyString());
    }

    @Test
    void neverDowngradesAUserThatAlreadyHasARole() {
        when(userRepository.count()).thenReturn(0L);
        User user = mock(User.class);
        Mockito.lenient().when(user.getRole()).thenReturn("Admin");

        AdminService.bootstrapAdminRole(userRepository, user);

        // re-setting "Admin" is harmless; setting anything else would be a downgrade.
        verify(user, never()).setRole("Student");
    }
}