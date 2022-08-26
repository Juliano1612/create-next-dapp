
const AccountInfo = ({ address, delegator }: { address: string, delegator?: string }) => {
    return (
        <div>
            {
                address &&
                <p>
                    <b>Address:</b> <code>{address}</code>
                </p>
            }
            {
                delegator &&
                <p>
                    <b>Delegator:</b> <code>{delegator}</code>
                </p>
            }
        </div>
    );
};

export default AccountInfo;