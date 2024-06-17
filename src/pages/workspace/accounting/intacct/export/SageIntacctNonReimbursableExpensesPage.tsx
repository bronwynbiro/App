import React, {useCallback, useMemo, useState} from 'react';
import {View} from 'react-native';
import type {ValueOf} from 'type-fest';
import MenuItemWithTopDescription from '@components/MenuItemWithTopDescription';
import OfflineWithFeedback from '@components/OfflineWithFeedback';
import RadioListItem from '@components/SelectionList/RadioListItem';
import type {ListItem} from '@components/SelectionList/types';
import SelectionScreen from '@components/SelectionScreen';
import type {SelectorType} from '@components/SelectionScreen';
import Text from '@components/Text';
import useLocalize from '@hooks/useLocalize';
import useThemeStyles from '@hooks/useThemeStyles';
import * as Connections from '@libs/actions/connections';
import {getSageIntacctActiveDefaultVendor} from '@libs/PolicyUtils';
import Navigation from '@navigation/Navigation';
import type {WithPolicyProps} from '@pages/workspace/withPolicy';
import withPolicyConnections from '@pages/workspace/withPolicyConnections';
import ToggleSettingOptionRow from '@pages/workspace/workflows/ToggleSettingsOptionRow';
import CONST from '@src/CONST';
import ROUTES from '@src/ROUTES';

type MenuListItem = ListItem & {
    value: ValueOf<typeof CONST.SAGE_INTACCT_NON_REIMBURSABLE_EXPENSE_TYPE>;
};

function SageIntacctNonReimbursableExpensesPage({policy}: WithPolicyProps) {
    const {translate} = useLocalize();
    const policyID = policy?.id ?? '-1';
    const styles = useThemeStyles();
    const {
        data: intacctData,
        config: {export: exportConfig, pendingFields, errorFields},
    } = policy?.connections?.intacct ?? {};

    const [isSwitchOn, setIsSwitchOn] = useState(!!exportConfig.nonReimbursableCreditCardChargeDefaultVendor);

    const data: MenuListItem[] = Object.values(CONST.SAGE_INTACCT_NON_REIMBURSABLE_EXPENSE_TYPE).map((expenseType) => ({
        value: expenseType,
        text: translate(`workspace.sageIntacct.nonReimbursableExpenses.values.${expenseType}`),
        keyForList: expenseType,
        isSelected: exportConfig.nonReimbursable === expenseType,
    }));

    const headerContent = useMemo(
        () => (
            <View>
                <Text style={[styles.ph5, styles.pb5]}>{translate('workspace.sageIntacct.nonReimbursableExpenses.description')}</Text>
            </View>
        ),
        [translate, styles.pb5, styles.ph5],
    );

    const selectNonReimbursableExpense = useCallback(
        (row: SelectorType) => {
            if (row.value === exportConfig.nonReimbursable) {
                return;
            }
            Connections.updatePolicyConnectionConfig(policyID, CONST.POLICY.CONNECTIONS.NAME.SAGE_INTACCT, CONST.XERO_CONFIG.EXPORT, {nonReimbursable: row.value});
        },
        [exportConfig.nonReimbursable, policyID],
    );

    const activeDefaultVendor = getSageIntacctActiveDefaultVendor(policy);
    const defaultVendorSection = {
        description: translate('workspace.sageIntacct.defaultVendor'),
        action: () => Navigation.navigate(ROUTES.POLICY_ACCOUNTING_SAGE_INTACCT_NON_REIMBURSABLE_DEFAULT_VENDOR.getRoute(policyID)),
        title: activeDefaultVendor ? intacctData.vendors.find((vendor) => vendor.id === activeDefaultVendor).value : translate('workspace.sageIntacct.notConfigured'),
        hasError: !!errorFields?.exporter,
        pendingAction: pendingFields?.export,
    };

    const defaultVendor = (
        <OfflineWithFeedback
            key={defaultVendorSection.description}
            pendingAction={defaultVendorSection.pendingAction}
        >
            <MenuItemWithTopDescription
                title={defaultVendorSection.title}
                description={defaultVendorSection.description}
                shouldShowRightIcon
                onPress={defaultVendorSection.action}
                brickRoadIndicator={defaultVendorSection.hasError ? CONST.BRICK_ROAD_INDICATOR_STATUS.ERROR : undefined}
            />
        </OfflineWithFeedback>
    );

    const creditCardAccountSection = {
        description: translate('workspace.sageIntacct.creditCardAccount'),
        action: () => Navigation.navigate(ROUTES.POLICY_ACCOUNTING_SAGE_INTACCT_NON_REIMBURSABLE_CREDIT_CARD_ACCOUNT.getRoute(policyID)),
        title: exportConfig.nonReimbursableAccount
            ? intacctData.creditCards.find((creditCard) => creditCard.id === exportConfig.nonReimbursableAccount).name
            : translate('workspace.sageIntacct.notConfigured'),
        hasError: !!errorFields?.exporter,
        pendingAction: pendingFields?.export,
    };

    const creditCardAccount = (
        <OfflineWithFeedback
            key={creditCardAccountSection.description}
            pendingAction={creditCardAccountSection.pendingAction}
        >
            <MenuItemWithTopDescription
                title={creditCardAccountSection.title}
                description={creditCardAccountSection.description}
                shouldShowRightIcon
                onPress={creditCardAccountSection.action}
                brickRoadIndicator={creditCardAccountSection.hasError ? CONST.BRICK_ROAD_INDICATOR_STATUS.ERROR : undefined}
            />
        </OfflineWithFeedback>
    );

    return (
        <View>
            <SelectionScreen
                displayName={SageIntacctNonReimbursableExpensesPage.displayName}
                title="workspace.sageIntacct.nonReimbursableExpenses.label"
                headerContent={headerContent}
                sections={[{data}]}
                listItem={RadioListItem}
                onSelectRow={selectNonReimbursableExpense}
                initiallyFocusedOptionKey={data.find((mode) => mode.isSelected)?.keyForList}
                policyID={policyID}
                accessVariants={[CONST.POLICY.ACCESS_VARIANTS.ADMIN]}
                featureName={CONST.POLICY.MORE_FEATURES.ARE_CONNECTIONS_ENABLED}
                onBackButtonPress={() => Navigation.goBack(ROUTES.POLICY_ACCOUNTING_SAGE_INTACCT_EXPORT.getRoute(policyID))}
                connectionName={CONST.POLICY.CONNECTIONS.NAME.SAGE_INTACCT}
            />
            {exportConfig.nonReimbursable === CONST.SAGE_INTACCT_NON_REIMBURSABLE_EXPENSE_TYPE.VENDOR_BILL && defaultVendor}
            {exportConfig.nonReimbursable === CONST.SAGE_INTACCT_NON_REIMBURSABLE_EXPENSE_TYPE.CREDIT_CARD_CHARGE && (
                <View>
                    {creditCardAccount}
                    <ToggleSettingOptionRow
                        title={translate('workspace.sageIntacct.defaultVendor')}
                        subtitle={translate('workspace.sageIntacct.defaultVendorDescription')}
                        shouldPlaceSubtitleBelowSwitch
                        switchAccessibilityLabel={translate('workspace.sageIntacct.defaultVendor')}
                        isActive={isSwitchOn}
                        onToggle={() => {
                            Connections.updatePolicyConnectionConfig(policyID, CONST.POLICY.CONNECTIONS.NAME.SAGE_INTACCT, CONST.XERO_CONFIG.EXPORT, {
                                nonReimbursableCreditCardChargeDefaultVendor: null,
                            });
                            setIsSwitchOn(!isSwitchOn);
                        }}
                        wrapperStyle={[styles.ph5, styles.pv3]}
                    />
                    {isSwitchOn && defaultVendor}
                </View>
            )}
        </View>
    );
}

SageIntacctNonReimbursableExpensesPage.displayName = 'PolicySageIntacctNonReimbursableExpensesPage';

export default withPolicyConnections(SageIntacctNonReimbursableExpensesPage);
