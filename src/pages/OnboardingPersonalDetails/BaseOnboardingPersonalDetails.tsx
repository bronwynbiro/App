import React, {useCallback, useEffect, useState} from 'react';
import {View} from 'react-native';
import {useOnyx} from 'react-native-onyx';
import FormProvider from '@components/Form/FormProvider';
import InputWrapper from '@components/Form/InputWrapper';
import type {FormOnyxValues} from '@components/Form/types';
import HeaderWithBackButton from '@components/HeaderWithBackButton';
import OfflineIndicator from '@components/OfflineIndicator';
import ScreenWrapper from '@components/ScreenWrapper';
import Text from '@components/Text';
import TextInput from '@components/TextInput';
import withCurrentUserPersonalDetails from '@components/withCurrentUserPersonalDetails';
import useAutoFocusInput from '@hooks/useAutoFocusInput';
import useLocalize from '@hooks/useLocalize';
import useNetwork from '@hooks/useNetwork';
import useResponsiveLayout from '@hooks/useResponsiveLayout';
import useThemeStyles from '@hooks/useThemeStyles';
import * as ErrorUtils from '@libs/ErrorUtils';
import Navigation from '@libs/Navigation/Navigation';
import * as ValidationUtils from '@libs/ValidationUtils';
import * as PersonalDetails from '@userActions/PersonalDetails';
import * as Report from '@userActions/Report';
import * as Welcome from '@userActions/Welcome';
import * as OnboardingFlow from '@userActions/Welcome/OnboardingFlow';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import INPUT_IDS from '@src/types/form/DisplayNameForm';
import type {BaseOnboardingPersonalDetailsProps} from './types';
import ROUTES from '@src/ROUTES';
import * as LoginUtils from '@libs/LoginUtils';

function BaseOnboardingPersonalDetails({currentUserPersonalDetails, shouldUseNativeStyles, route}: BaseOnboardingPersonalDetailsProps) {
    const styles = useThemeStyles();
    const {translate} = useLocalize();
    const [onboardingPurposeSelected] = useOnyx(ONYXKEYS.ONBOARDING_PURPOSE_SELECTED);
    const [onboardingPolicyID] = useOnyx(ONYXKEYS.ONBOARDING_POLICY_ID);
    const [onboardingAdminsChatReportID] = useOnyx(ONYXKEYS.ONBOARDING_ADMINS_CHAT_REPORT_ID);
    const {shouldUseNarrowLayout, isSmallScreenWidth, onboardingIsMediumOrLargerScreenWidth} = useResponsiveLayout();
    const {inputCallbackRef} = useAutoFocusInput();
    const [shouldValidateOnChange, setShouldValidateOnChange] = useState(false);
    const {isOffline} = useNetwork();
    const [session] = useOnyx(ONYXKEYS.SESSION);
    const isPrivateDomain = !!session?.email && !LoginUtils.isEmailPublicDomain(session?.email);

    useEffect(() => {
        Welcome.setOnboardingErrorMessage('');
    }, []);

    const handleSubmit = useCallback(
        (values: FormOnyxValues<'onboardingPersonalDetailsForm'>) => {
            const firstName = values.firstName.trim();
            const lastName = values.lastName.trim();

            PersonalDetails.setDisplayName(firstName, lastName);

            if (isPrivateDomain) {
                Navigation.navigate(ROUTES.ONBOARDING_PRIVATE_DOMAIN.getRoute(route.params?.backTo));
                return;
            }

            if (!onboardingPurposeSelected) {
                return;
            }

            Report.completeOnboarding(
                onboardingPurposeSelected,
                CONST.ONBOARDING_MESSAGES[onboardingPurposeSelected],
                firstName,
                lastName,
                onboardingAdminsChatReportID ?? undefined,
                onboardingPolicyID,
            );

            Welcome.setOnboardingAdminsChatReportID();
            Welcome.setOnboardingPolicyID();

            Navigation.dismissModal();

            // Only navigate to concierge chat when central pane is visible
            // Otherwise stay on the chats screen.
            if (!shouldUseNarrowLayout && !route.params?.backTo) {
                Report.navigateToConciergeChat();
            }
        },
        [onboardingPurposeSelected, onboardingAdminsChatReportID, onboardingPolicyID, shouldUseNarrowLayout, route.params?.backTo],
    );

    const validate = (values: FormOnyxValues<'onboardingPersonalDetailsForm'>) => {
        if (!shouldValidateOnChange) {
            setShouldValidateOnChange(true);
        }

        const errors = {};

        // First we validate the first name field
        if (values.firstName.replace(CONST.REGEX.ANY_SPACE, '').length === 0) {
            ErrorUtils.addErrorMessage(errors, 'firstName', translate('onboarding.error.requiredFirstName'));
        }
        if (!ValidationUtils.isValidDisplayName(values.firstName)) {
            ErrorUtils.addErrorMessage(errors, 'firstName', translate('personalDetails.error.hasInvalidCharacter'));
        } else if (values.firstName.length > CONST.DISPLAY_NAME.MAX_LENGTH) {
            ErrorUtils.addErrorMessage(errors, 'firstName', translate('common.error.characterLimitExceedCounter', {length: values.firstName.length, limit: CONST.DISPLAY_NAME.MAX_LENGTH}));
        }
        if (ValidationUtils.doesContainReservedWord(values.firstName, CONST.DISPLAY_NAME.RESERVED_NAMES)) {
            ErrorUtils.addErrorMessage(errors, 'firstName', translate('personalDetails.error.containsReservedWord'));
        }

        // Then we validate the last name field
        if (!ValidationUtils.isValidDisplayName(values.lastName)) {
            ErrorUtils.addErrorMessage(errors, 'lastName', translate('personalDetails.error.hasInvalidCharacter'));
        } else if (values.lastName.length > CONST.DISPLAY_NAME.MAX_LENGTH) {
            ErrorUtils.addErrorMessage(errors, 'lastName', translate('common.error.characterLimitExceedCounter', {length: values.lastName.length, limit: CONST.DISPLAY_NAME.MAX_LENGTH}));
        }
        if (ValidationUtils.doesContainReservedWord(values.lastName, CONST.DISPLAY_NAME.RESERVED_NAMES)) {
            ErrorUtils.addErrorMessage(errors, 'lastName', translate('personalDetails.error.containsReservedWord'));
        }

        return errors;
    };

    return (
        <ScreenWrapper
            shouldEnableMaxHeight
            shouldShowOfflineIndicator={false}
            includeSafeAreaPaddingBottom={isOffline}
            testID="BaseOnboardingPersonalDetails"
            style={[styles.defaultModalContainer, shouldUseNativeStyles && styles.pt8]}
        >
            <HeaderWithBackButton
                shouldShowBackButton
                progressBarPercentage={isPrivateDomain ? 40 : 75}
                onBackButtonPress={OnboardingFlow.goBack}
            />
            <FormProvider
                style={[styles.flexGrow1, onboardingIsMediumOrLargerScreenWidth && styles.mt5, onboardingIsMediumOrLargerScreenWidth ? styles.mh8 : styles.mh5]}
                formID={ONYXKEYS.FORMS.ONBOARDING_PERSONAL_DETAILS_FORM}
                validate={validate}
                onSubmit={handleSubmit}
                submitButtonText={translate('common.continue')}
                enabledWhenOffline
                submitFlexEnabled
                shouldValidateOnBlur={false}
                shouldValidateOnChange={shouldValidateOnChange}
                shouldTrimValues={false}
            >
                <View style={[onboardingIsMediumOrLargerScreenWidth ? styles.flexRow : styles.flexColumn, styles.mb5]}>
                    <Text style={styles.textHeadlineH1}>{translate('onboarding.whatsYourName')}</Text>
                </View>
                <View style={styles.mb4}>
                    <InputWrapper
                        InputComponent={TextInput}
                        ref={inputCallbackRef}
                        inputID={INPUT_IDS.FIRST_NAME}
                        name="fname"
                        label={translate('common.firstName')}
                        aria-label={translate('common.firstName')}
                        role={CONST.ROLE.PRESENTATION}
                        defaultValue={currentUserPersonalDetails?.firstName}
                        shouldSaveDraft
                        maxLength={CONST.DISPLAY_NAME.MAX_LENGTH}
                        spellCheck={false}
                    />
                </View>
                <View>
                    <InputWrapper
                        InputComponent={TextInput}
                        inputID={INPUT_IDS.LAST_NAME}
                        name="lname"
                        label={translate('common.lastName')}
                        aria-label={translate('common.lastName')}
                        role={CONST.ROLE.PRESENTATION}
                        defaultValue={currentUserPersonalDetails?.lastName}
                        shouldSaveDraft
                        maxLength={CONST.DISPLAY_NAME.MAX_LENGTH}
                        spellCheck={false}
                    />
                </View>
            </FormProvider>
            {isSmallScreenWidth && <OfflineIndicator />}
        </ScreenWrapper>
    );
}

BaseOnboardingPersonalDetails.displayName = 'BaseOnboardingPersonalDetails';

export default withCurrentUserPersonalDetails(BaseOnboardingPersonalDetails);
