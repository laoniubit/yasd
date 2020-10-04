/** @jsx jsx */
import { jsx } from '@emotion/core'
import React, {
  FormEventHandler,
  useCallback,
  useEffect,
  useState,
} from 'react'
import { Heading, Input, LoadingButton } from '@sumup/circuit-ui'
import styled from '@emotion/styled/macro'
import tw from 'twin.macro'
import axios from 'axios'
import store from 'store2'
import { v4 as uuid } from 'uuid'
import { find } from 'lodash-es'
import { useHistory } from 'react-router-dom'

import ProfileCell from '../../components/ProfileCell'
import useSetState from '../../hooks/use-set-state'
import { Profile } from '../../types'
import { ExistingProfiles, LastUsedProfile } from '../../utils/constant'

const Page: React.FC = () => {
  const history = useHistory()
  const [name, setName] = useState<string | undefined>()
  const [host, setHost] = useState<string | undefined>()
  const [port, setPort] = useState<string | undefined>()
  const [key, setKey] = useState<string | undefined>()
  const [
    existingProfiles,
    setExistingProfiles,
    getExistingProfiles,
  ] = useSetState<Array<Profile>>([])
  const [hasError, setHasError] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const addProfile = (config: Omit<Profile, 'id'>): Profile => {
    const profile: Profile = {
      ...config,
      id: uuid(),
    }
    const newProfiles = [profile, ...existingProfiles]
    setExistingProfiles(newProfiles)
    store.set(ExistingProfiles, newProfiles)
    store.set(LastUsedProfile, profile.id)

    return profile
  }

  const selectProfile = useCallback(
    (id: string) => {
      getExistingProfiles().then((profiles) => {
        const profile = find(profiles, { id })

        if (profile) {
          store.set(LastUsedProfile, profile.id)
          history.replace('/home')
        }
      })
    },
    [getExistingProfiles, history],
  )

  const deleteProfile = useCallback(
    (id: string) => {
      const profiles = existingProfiles.filter((item) => item.id !== id)

      setExistingProfiles(profiles)
      store.set(ExistingProfiles, profiles)
    },
    [setExistingProfiles, existingProfiles],
  )

  const resetFields = () => {
    setName('')
    setHost('')
    setPort('')
    setKey('')
  }

  const onSubmit: FormEventHandler = (e) => {
    e.preventDefault()

    if (!name || !host || !port || !key) {
      return
    }

    setIsLoading(true)

    axios
      .request({
        url: `//${host}:${port}/v1/outbound`,
        method: 'GET',
        timeout: 3000,
        headers: {
          'x-key': key,
        },
      })
      .then((res) => {
        setHasError(false)

        const newProfile = addProfile({
          name,
          host,
          port: Number(port),
          key,
          platform: res.headers['x-system']?.includes('macOS')
            ? 'macos'
            : 'ios',
          platformVersion: res.headers['x-surge-version'] || '',
          platformBuild: res.headers['x-surge-build'] || '',
        })

        resetFields()
        setIsLoading(false)
        selectProfile(newProfile.id)
      })
      .catch((err) => {
        setHasError(true)
        console.error(err)
        setIsLoading(false)
      })
  }

  useEffect(() => {
    const storedExistingProfiles = store.get(ExistingProfiles)

    if (storedExistingProfiles) {
      setExistingProfiles(storedExistingProfiles)
    }
  }, [setExistingProfiles])

  return (
    <div tw="pb-5">
      <Heading
        size={'tera'}
        noMargin
        tw="sticky top-0 flex shadow bg-white z-10 px-3 py-3 mb-4">
        YASD
      </Heading>

      <div tw="max-w-xs sm:max-w-sm md:max-w-md mx-auto">
        <Heading size={'tera'}>Add new Host</Heading>

        <form onSubmit={onSubmit}>
          <Input
            type="text"
            required
            invalid={hasError}
            label="Name"
            placeholder="Mac"
            value={name}
            onChange={({ target }) =>
              setName((target as HTMLInputElement).value)
            }
          />
          <Input
            type="text"
            required
            invalid={hasError}
            label="Host"
            placeholder="127.0.0.1"
            value={host}
            onChange={({ target }) =>
              setHost((target as HTMLInputElement).value)
            }
          />
          <Input
            type="number"
            required
            invalid={hasError}
            label="Port"
            placeholder="6171"
            value={port}
            onChange={({ target }) =>
              setPort((target as HTMLInputElement).value)
            }
          />
          <Input
            type="text"
            required
            invalid={hasError}
            label="Key"
            placeholder="examplekey"
            value={key}
            onChange={({ target }) =>
              setKey((target as HTMLInputElement).value)
            }
          />
          <LoadingButton
            type="submit"
            variant="primary"
            stretch
            isLoading={isLoading}
            loadingLabel={'Loading'}>
            Done
          </LoadingButton>
        </form>
      </div>

      <div tw="max-w-xs sm:max-w-sm md:max-w-md mx-auto mt-10">
        <Heading size={'mega'}>History</Heading>

        <div tw="bg-gray-100 divide-y divide-gray-200 rounded overflow-hidden">
          {existingProfiles.map((profile) => {
            return (
              <div key={profile.id} tw="hover:bg-gray-200">
                <ProfileCell
                  profile={profile}
                  checkConnectivity
                  showDelete
                  onClick={() => selectProfile(profile.id)}
                  onDelete={() => deleteProfile(profile.id)}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Page