import { Button, Form, Input, Select, Modal, Upload, Spin } from "antd";
import React, { useMemo, useRef, useState } from "react";
import { UploadOutlined } from "@ant-design/icons";
import debounce from "lodash/debounce";

const { Option } = Select;

function DebounceSelect({ fetchOptions, debounceTimeout = 800, ...props }) {
    const [fetching, setFetching] = useState(false);
    const [options, setOptions] = useState([]);
    const fetchRef = useRef(0);

    const debounceFetcher = useMemo(() => {
        const loadOptions = (value) => {
            fetchRef.current += 1;
            const fetchId = fetchRef.current;
            setOptions([]);
            setFetching(true);

            fetchOptions(value).then((newOptions) => {
                if (fetchId !== fetchRef.current) {
                    return;
                }
                setOptions(newOptions);
                setFetching(false);
            });
        };

        return debounce(loadOptions, debounceTimeout);
    }, [fetchOptions, debounceTimeout]);

    return (
        <Select
            labelInValue
            filterOption={false}
            onSearch={debounceFetcher}
            notFoundContent={
                fetching ? (
                    <Spin size="small" />
                ) : (
                    <div style={{ padding: '8px', textAlign: 'center', color: '#999' }}>
                        No results found
                    </div>
                )
            }
            {...props}
            options={options}
        />
    );
}

export default DebounceSelect;
