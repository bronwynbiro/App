import lodashEscape from 'lodash/escape';
import React from 'react';
import type {OnyxEntry} from 'react-native-onyx';
import {withOnyx} from 'react-native-onyx';
import useLocalize from '@hooks/useLocalize';
import useThemeStyles from '@hooks/useThemeStyles';
import {getCurrentUserAccountID} from '@libs/actions/Report';
import * as PersonalDetailsUtils from '@libs/PersonalDetailsUtils';
import * as ReportActionsUtils from '@libs/ReportActionsUtils';
import * as ReportUtils from '@libs/ReportUtils';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import type {PersonalDetailsList, Report, ReportAction} from '@src/types/onyx';
import Banner from './Banner';

type ArchivedReportFooterOnyxProps = {
    /** The reason this report was archived */
    reportClosedAction: OnyxEntry<ReportAction>;

    /** Personal details of all users */
    personalDetails: OnyxEntry<PersonalDetailsList>;
};

type ArchivedReportFooterProps = ArchivedReportFooterOnyxProps & {
    /** The archived report */
    report: Report;
};

function ArchivedReportFooter({report, reportClosedAction, personalDetails = {}}: ArchivedReportFooterProps) {
    const styles = useThemeStyles();
    const {translate} = useLocalize();

    const originalMessage = ReportActionsUtils.isClosedAction(reportClosedAction) ? ReportActionsUtils.getOriginalMessage(reportClosedAction) : null;
    const archiveReason = originalMessage?.reason ?? CONST.REPORT.ARCHIVE_REASON.DEFAULT;
    const actorPersonalDetails = personalDetails?.[reportClosedAction?.actorAccountID ?? -1];
    let displayName = PersonalDetailsUtils.getDisplayNameOrDefault(actorPersonalDetails);

    let oldDisplayName: string | undefined;
    if (archiveReason === CONST.REPORT.ARCHIVE_REASON.ACCOUNT_MERGED) {
        const newAccountID = originalMessage?.newAccountID;
        const oldAccountID = originalMessage?.oldAccountID;
        displayName = PersonalDetailsUtils.getDisplayNameOrDefault(personalDetails?.[newAccountID ?? -1]);
        oldDisplayName = PersonalDetailsUtils.getDisplayNameOrDefault(personalDetails?.[oldAccountID ?? -1]);
    }

    const shouldRenderHTML = archiveReason !== CONST.REPORT.ARCHIVE_REASON.DEFAULT && archiveReason !== CONST.REPORT.ARCHIVE_REASON.BOOKING_END_DATE_HAS_PASSED;

    let policyName = ReportUtils.getPolicyName(report);

    if (shouldRenderHTML) {
        oldDisplayName = lodashEscape(oldDisplayName);
        displayName = lodashEscape(displayName);
        policyName = lodashEscape(policyName);
    }

    let text: string;
    switch (archiveReason) {
        case CONST.REPORT.ARCHIVE_REASON.ACCOUNT_CLOSED:
            text = translate(`reportArchiveReasons.${archiveReason}`, {
                displayName: `<strong>${displayName}</strong>`,
            });
            break;
        case CONST.REPORT.ARCHIVE_REASON.ACCOUNT_MERGED:
            text = translate(`reportArchiveReasons.${archiveReason}`, {
                displayName: `<strong>${displayName}</strong>`,
                oldDisplayName: `<strong>${oldDisplayName}</strong>`,
            });
            break;
        case CONST.REPORT.ARCHIVE_REASON.REMOVED_FROM_POLICY:
            text = translate(`reportArchiveReasons.${archiveReason}`, {
                displayName: `<strong>${displayName}</strong>`,
                policyName: `<strong>${policyName}</strong>`,
                shouldUseYou: actorPersonalDetails?.accountID === getCurrentUserAccountID(),
            });
            break;
        case CONST.REPORT.ARCHIVE_REASON.POLICY_DELETED:
            text = translate(`reportArchiveReasons.${archiveReason}`, {
                policyName: `<strong>${policyName}</strong>`,
            });
            break;
        default:
            text = translate(`reportArchiveReasons.${archiveReason}`);
            break;
    }

    return (
        <Banner
            containerStyles={[styles.chatFooterBanner]}
            text={text}
            shouldRenderHTML={shouldRenderHTML}
            shouldShowIcon
        />
    );
}

ArchivedReportFooter.displayName = 'ArchivedReportFooter';

export default withOnyx<ArchivedReportFooterProps, ArchivedReportFooterOnyxProps>({
    personalDetails: {
        key: ONYXKEYS.PERSONAL_DETAILS_LIST,
    },
    reportClosedAction: {
        key: ({report}) => `${ONYXKEYS.COLLECTION.REPORT_ACTIONS}${report.reportID}`,
        canEvict: false,
        selector: ReportActionsUtils.getLastClosedReportAction,
    },
})(ArchivedReportFooter);
